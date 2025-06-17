// src/stores/feedStore.js - Store Zustand avec gestion des erreurs 401

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useFeedStore = create(
  persist(
    (set, get) => ({
      // État
      posts: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        hasNext: false,
        total: 0
      },
      pendingLikes: new Set(),
      feedFilter: 'recent', // 'recent', 'friends', 'popular'

      // Actions pour les posts
      setPosts: (posts) => set({ posts }),
      
      addPosts: (newPosts) => set((state) => ({
        posts: [...state.posts, ...newPosts]
      })),
      
      prependPost: (post) => set((state) => ({
        posts: [post, ...state.posts]
      })),

      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination }
      })),

      setFeedFilter: (filter) => set({ feedFilter: filter }),

      // ✅ FONCTION HELPER POUR GÉRER LES TOKENS EXPIRÉS
      handleTokenExpiry: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // Pas de refresh token, rediriger vers login
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Session expirée');
        }

        try {
          const refreshResponse = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshResponse.ok) {
            const { accessToken } = await refreshResponse.json();
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
          } else {
            // Refresh token invalide, rediriger vers login
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('Session expirée');
          }
        } catch (error) {
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Erreur de connexion');
        }
      },

      // ✅ FETCH AVEC GESTION AUTOMATIQUE DES 401
      authenticatedFetch: async (url, options = {}) => {
        const { handleTokenExpiry } = get();
        let token = localStorage.getItem('accessToken');
        
        if (!token) {
          throw new Error('Non authentifié');
        }

        const config = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
          }
        };

        let response = await fetch(url, config);

        // Si 401, essayer de rafraîchir le token
        if (response.status === 401) {
          try {
            token = await handleTokenExpiry();
            
            // Retry avec le nouveau token
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                'Authorization': `Bearer ${token}`
              }
            };
            
            response = await fetch(url, retryConfig);
          } catch (error) {
            throw error;
          }
        }

        return response;
      },

      // Actions pour les likes
      addPendingLike: (postId) => set((state) => ({
        pendingLikes: new Set([...state.pendingLikes, postId])
      })),
      
      removePendingLike: (postId) => set((state) => {
        const newPending = new Set(state.pendingLikes);
        newPending.delete(postId);
        return { pendingLikes: newPending };
      }),

      // Optimistic update du like
      toggleLikeOptimistic: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            const wasLiked = post.isLikedByCurrentUser || post.isLiked;
            return {
              ...post,
              isLiked: !wasLiked,
              isLikedByCurrentUser: !wasLiked,
              likeCount: wasLiked 
                ? Math.max(0, (post.likeCount || 0) - 1) 
                : (post.likeCount || 0) + 1,
              likesCount: wasLiked 
                ? Math.max(0, (post.likesCount || 0) - 1) 
                : (post.likesCount || 0) + 1
            };
          }
          return post;
        })
      })),

      // Synchroniser avec la réponse serveur
      syncLikeFromServer: (postId, serverData) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            return {
              ...post,
              isLiked: serverData.isLiked,
              isLikedByCurrentUser: serverData.isLiked,
              likeCount: serverData.likeCount,
              likesCount: serverData.likeCount
            };
          }
          return post;
        })
      })),

      // Rollback en cas d'erreur
      rollbackLike: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            const currentlyLiked = post.isLikedByCurrentUser || post.isLiked;
            return {
              ...post,
              isLiked: !currentlyLiked,
              isLikedByCurrentUser: !currentlyLiked,
              likeCount: currentlyLiked 
                ? (post.likeCount || 0) + 1 
                : Math.max(0, (post.likeCount || 0) - 1),
              likesCount: currentlyLiked 
                ? (post.likesCount || 0) + 1 
                : Math.max(0, (post.likesCount || 0) - 1)
            };
          }
          return post;
        })
      })),

      // ✅ CHARGER LES POSTS AVEC GESTION 401
      fetchPosts: async (reset = false, page = 1) => {
        const { setLoading, setError, setPosts, addPosts, setPagination, feedFilter, authenticatedFetch } = get();
        
        setLoading(true);
        setError(null);

        try {
          // Déterminer l'endpoint selon le filtre
          const endpoints = {
            recent: '/api/v1/posts/timeline/personal',
            friends: '/api/v1/posts/timeline/personal',
            popular: '/api/v1/posts/trending'
          };

          const endpoint = endpoints[feedFilter] || endpoints.recent;
          
          const response = await authenticatedFetch(`${endpoint}?page=${page}&limit=20`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur ${response.status}`);
          }

          const data = await response.json();
          const newPosts = data.posts || [];

          if (reset) {
            setPosts(newPosts);
          } else {
            addPosts(newPosts);
          }

          setPagination({
            page: data.pagination?.page || page,
            limit: data.pagination?.limit || 20,
            hasNext: data.pagination?.hasNext || false,
            total: data.pagination?.total || 0
          });

          console.log(`✅ ${newPosts.length} posts chargés (page ${page})`);

        } catch (error) {
          console.error('❌ Erreur chargement posts:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      },

      // Créer un nouveau post
      createPost: async (content) => {
        const { setError, prependPost, authenticatedFetch } = get();
        
        try {
          setError(null);
          
          const response = await authenticatedFetch('/api/v1/posts', {
            method: 'POST',
            body: JSON.stringify({
              content: content.trim(),
              id_message_type: 1
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la création du post');
          }

          const data = await response.json();
          prependPost(data.post);
          
          console.log('✅ Post créé avec succès');
          return { success: true, post: data.post };

        } catch (error) {
          console.error('❌ Erreur création post:', error);
          setError(error.message);
          return { success: false, error: error.message };
        }
      },

      // ✅ LIKE/UNLIKE avec gestion 401
      toggleLike: async (postId) => {
        const { 
          pendingLikes, 
          addPendingLike, 
          removePendingLike,
          toggleLikeOptimistic,
          syncLikeFromServer,
          rollbackLike,
          setError,
          authenticatedFetch
        } = get();

        // Éviter les doubles requêtes
        if (pendingLikes.has(postId)) {
          console.log('Like déjà en cours...');
          return;
        }

        try {
          addPendingLike(postId);
          
          // Optimistic update
          toggleLikeOptimistic(postId);
          
          const response = await authenticatedFetch(`/api/v1/likes/posts/${postId}`, {
            method: 'POST'
          });

          if (response.ok) {
            const data = await response.json();
            // Synchroniser avec le serveur
            syncLikeFromServer(postId, data);
            console.log(`✅ Like ${data.isLiked ? 'ajouté' : 'retiré'}`);
          } else {
            // Rollback en cas d'erreur
            rollbackLike(postId);
            const errorData = await response.json().catch(() => ({}));
            setError('Erreur lors du like');
            console.error('❌ Erreur like:', errorData);
          }

        } catch (error) {
          // Rollback en cas d'erreur réseau
          rollbackLike(postId);
          setError('Erreur de connexion');
          console.error('❌ Erreur réseau like:', error);
        } finally {
          removePendingLike(postId);
        }
      },

      // Nettoyer le store (lors de la déconnexion)
      clearFeed: () => set({
        posts: [],
        isLoading: false,
        error: null,
        pagination: { page: 1, limit: 20, hasNext: false, total: 0 },
        pendingLikes: new Set(),
        feedFilter: 'recent'
      })
    }),
    {
      name: 'feed-storage',
      storage: createJSONStorage(() => localStorage),
      // Persister seulement certaines données
      partialize: (state) => ({
        posts: state.posts,
        feedFilter: state.feedFilter,
        // Ne pas persister les états temporaires
      }),
      version: 1,
    }
  )
);

export default useFeedStore;