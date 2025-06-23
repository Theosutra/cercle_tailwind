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

        // ✅ Gestion automatique des 401
        if (response.status === 401) {
          console.log('🔄 Token expiré, tentative de refresh...');
          
          try {
            const newToken = await handleTokenExpiry();
            // Refaire la requête avec le nouveau token
            config.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, config);
          } catch (refreshError) {
            throw refreshError;
          }
        }

        return response;
      },

      // Gestion des likes
      addPendingLike: (postId) => set((state) => ({
        pendingLikes: new Set([...state.pendingLikes, postId])
      })),

      removePendingLike: (postId) => set((state) => {
        const newPending = new Set(state.pendingLikes);
        newPending.delete(postId);
        return { pendingLikes: newPending };
      }),

      toggleLikeOptimistic: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            const currentlyLiked = post.isLikedByCurrentUser;
            return {
              ...post,
              isLikedByCurrentUser: !currentlyLiked,
              likeCount: currentlyLiked 
                ? Math.max(0, (post.likeCount || 0) - 1)
                : (post.likeCount || 0) + 1,
              likesCount: currentlyLiked 
                ? Math.max(0, (post.likesCount || 0) - 1) 
                : (post.likesCount || 0) + 1
            };
          }
          return post;
        })
      })),

      syncLikeFromServer: (postId, serverData) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            return {
              ...post,
              isLikedByCurrentUser: serverData.isLiked || serverData.liked,
              likeCount: serverData.likeCount || serverData.likesCount || post.likeCount,
              likesCount: serverData.likeCount || serverData.likesCount || post.likesCount
            };
          }
          return post;
        })
      })),

      rollbackLike: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id_post === postId) {
            const currentlyLiked = post.isLikedByCurrentUser;
            return {
              ...post,
              isLikedByCurrentUser: !currentlyLiked,
              likeCount: currentlyLiked 
                ? Math.max(0, (post.likeCount || 0) - 1)
                : (post.likeCount || 0) + 1,
              likesCount: currentlyLiked 
                ? Math.max(0, (post.likesCount || 0) - 1) 
                : (post.likesCount || 0) + 1
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
          // ✅ CORRECTION CRITIQUE: Endpoints corrigés
          const endpoints = {
            recent: '/api/v1/posts/public',              // ✅ Posts publics
            friends: '/api/v1/posts/timeline/personal',  // ✅ Posts des amis
            popular: '/api/v1/posts/trending'            // ✅ Posts populaires
          };

          const endpoint = endpoints[feedFilter] || endpoints.recent;
          
          console.log(`🔍 Fetching from: ${endpoint} (filter: ${feedFilter})`);
          
          const response = await authenticatedFetch(`${endpoint}?page=${page}&limit=20`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.message || `Erreur ${response.status}`);
          }

          const data = await response.json();
          const newPosts = data.posts || [];

          console.log(`✅ Posts récupérés:`, {
            count: newPosts.length,
            endpoint,
            posts: newPosts.map(p => ({
              id: p.id_post,
              author: p.author?.username,
              content: p.content?.substring(0, 50) + '...'
            }))
          });

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

        if (pendingLikes.has(postId)) {
          console.log('Like déjà en cours...');
          return;
        }

        try {
          addPendingLike(postId);
          toggleLikeOptimistic(postId);
          
          const response = await authenticatedFetch(`/api/v1/likes/posts/${postId}`, {
            method: 'POST'
          });

          if (response.ok) {
            const data = await response.json();
            syncLikeFromServer(postId, data);
            console.log(`✅ Like ${data.isLiked ? 'ajouté' : 'retiré'}`);
          } else {
            rollbackLike(postId);
            const errorData = await response.json().catch(() => ({}));
            setError('Erreur lors du like');
            console.error('❌ Erreur like:', errorData);
          }

        } catch (error) {
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
      partialize: (state) => ({
        posts: state.posts,
        feedFilter: state.feedFilter,
      }),
      version: 1,
    }
  )
);

export default useFeedStore;