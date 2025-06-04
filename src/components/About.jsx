import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="min-h-screen bg-white relative">
      
      {/* Logo flottant en haut à gauche */}
      <div className="absolute top-8 left-8 z-10">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-gray-800">Cercle</span>
        </Link>
      </div>

      {/* Navigation flottante en haut à droite */}
      <nav className="absolute top-8 right-8 z-10 flex items-center space-x-4">
        <Link 
          to="/" 
          className="text-gray-600 hover:text-gray-800 font-medium text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all duration-200"
        >
          Accueil
        </Link>
        <Link 
          to="/feed" 
          className="text-gray-600 hover:text-gray-800 font-medium text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all duration-200"
        >
          Découvrir
        </Link>
        <div className="w-px h-6 bg-gray-300"></div>
        <Link 
          to="/login" 
          className="text-gray-600 hover:text-gray-800 font-medium text-sm"
        >
          Connexion
        </Link>
        <Link 
          to="/register" 
          className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700 font-medium text-sm shadow-sm transition-all duration-200"
        >
          S'inscrire
        </Link>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        
        {/* Section À propos de Cercle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              À propos de Cercle
            </h1>
            
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p className="text-lg font-medium text-gray-800">
                Un réseau social pensé autrement.
              </p>
              
              <p className="text-sm">
                Nous avons créé Cercle parce qu'un vrai réseau intelligent
                est un réseau social efficace.
              </p>
              
              <p className="text-sm">
                Nous proposons ainsi une nouvelle approche : finit 
                l'algorithme pour les annonceurs et bonjour aux 100% de 
                communications entre amis de votre réseau.
              </p>
              
              <p className="text-sm">
                Cercle c'est l'anti-réseau.
              </p>
              
              <p className="text-sm">
                Un réseau social qui privilégie la bienveillance, plus juste 
                et plus libre.
              </p>
            </div>
          </div>

          {/* Image 1 */}
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
              alt="Personnes collaborant ensemble"
              className="w-full h-80 object-cover rounded-2xl"
            />
          </div>
        </div>

        {/* Section Notre vision */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre vision</h2>
          <p className="text-gray-600 leading-relaxed">
            Revenir à l'essentiel : un cercle, c'est un groupe de confiance, une bouffée de fraîcheur 
            pour s'améliorer, s'inspirer, une véritable famille pour grandir. C'est pour ça qu'on a construit 
            un service de messagerie qui facilite la création de lien à la maison, comme à l'aventure, en face-à-face.
          </p>
        </div>

        {/* Section Qui sommes-nous */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Qui sommes-nous ?</h2>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                Nous sommes une petite équipe de passionnés du web, de 
                la communication et de l'entrepreneuriat.
              </p>
              <p>
                Nous voulons créer les outils nécessaires pour faciliter et 
                aider de lien définir des bonnes idées et votre communauté.
              </p>
              <p>
                Peu de bullshit de notre côté, outils, plus d'humanité, 
                plus de solidarité dans votre organisation.
              </p>
              <p>
                C'est ça l'objectif qu'on se sent faire.
              </p>
            </div>
          </div>

          {/* Image 2 */}
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
              alt="Équipe unie et souriante"
              className="w-full h-80 object-cover rounded-2xl"
            />
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Prêt à rejoindre votre cercle ?
          </h3>
          <div className="flex justify-center">
            <Link 
              to="/register" 
              className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}

export default About