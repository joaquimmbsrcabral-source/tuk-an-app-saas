import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Users, Star, ChevronRight, Phone, Mail, Instagram, MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '351910000000' // TODO: Replace with real number
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de reservar um tour de TukTuk em Lisboa.')}`

const tours = [
  {
    id: 'historico',
    name: 'Tour Histórico',
    emoji: '\u{1F3DB}',
    tagline: 'A alma de Lisboa',
    description: 'Descubra a Lisboa antiga — Alfama, Sé Catedral, Castelo de São Jorge, Mouraria e os melhores miradouros. Uma viagem no tempo pelas ruas mais autênticas da cidade.',
    highlights: ['Alfama & Mouraria', 'Castelo de São Jorge', 'Sé Catedral', 'Miradouros panorâmicos', 'Graça & Chiado'],
    duration: '1h30',
    price: 60,
    maxPeople: 3,
  },
  {
    id: 'nova-lisboa',
    name: 'Nova Lisboa',
    emoji: '\u{1F306}',
    tagline: 'A cidade que reinventou',
    description: 'Explore os bairros mais trendy de Lisboa — Santos, Príncipe Real, Bairro Alto e Avenida da Liberdade. Arte urbana, rooftops e a energia moderna da capital.',
    highlights: ['Santos Design District', 'Príncipe Real', 'Bairro Alto', 'Av. da Liberdade', 'Estrela & Jardim'],
    duration: '1h30',
    price: 60,
    maxPeople: 3,
  },
  {
    id: 'belem',
    name: 'Belém',
    emoji: '\u{26F5}',
    tagline: 'Onde o mundo começou',
    description: 'A epopeia dos Descobrimentos espera por si — Torre de Belém, Mosteiro dos Jerónimos, Padrão dos Descobrimentos, LX Factory e os famosos Pastéis de Belém.',
    highlights: ['Torre de Belém', 'Mosteiro dos Jerónimos', 'Padrão dos Descobrimentos', 'LX Factory', 'Pastéis de Belém'],
    duration: '2h',
    price: 70,
    maxPeople: 3,
  },
]

const reviews = [
  { name: 'Sarah M.', country: 'UK', stars: 5, text: 'Amazing experience! Joaquim showed us hidden gems we never would have found on our own. The yellow TukTuk is iconic!' },
  { name: 'Marco P.', country: 'Italy', stars: 5, text: 'Best tour in Lisbon! Fun, authentic, and Joaquim knows every corner of the city. Highly recommended!' },
  { name: 'Anna K.', country: 'Germany', stars: 5, text: 'The Belém tour was perfect. Beautiful views, great stories, and the TukTuk ride itself is an adventure!' },
]

function TourCard({ tour }: { tour: typeof tours[0] }) {
  return (
    <div className="bg-white rounded-card shadow-card-md hover:shadow-card-lg transition-all duration-300 overflow-hidden group">
      <div className="bg-gradient-to-br from-yellow to-amber-400 p-8 text-center">
        <span className="text-5xl">{tour.emoji}</span>
      </div>
      <div className="p-6">
        <h3 className="font-outfit font-bold text-xl text-ink">{tour.name}</h3>
        <p className="text-sm text-copper font-outfit font-semibold mt-1">{tour.tagline}</p>
        <p className="text-ink2 text-sm mt-3 leading-relaxed">{tour.description}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {tour.highlights.map((h) => (
            <span key={h} className="text-2xs bg-cream text-ink2 px-2 py-1 rounded-full font-outfit">{h}</span>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-5 text-sm text-muted font-outfit">
          <span className="flex items-center gap-1"><Clock size={14} /> {tour.duration}</span>
          <span className="flex items-center gap-1"><Users size={14} /> Até {tour.maxPeople} pessoas</span>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
          <div>
            <span className="text-2xl font-outfit font-bold text-ink">{tour.price}€</span>
            <span className="text-sm text-muted ml-1">/ tour</span>
          </div>
          <a
            href={`${WHATSAPP_LINK}&text=${encodeURIComponent(`Olá! Gostaria de reservar o ${tour.name} em Lisboa.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green text-white px-5 py-2.5 rounded-btn font-outfit font-semibold text-sm hover:bg-green/90 transition-colors flex items-center gap-2"
          >
            Reservar <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: review.stars }).map((_, i) => (
          <Star key={i} size={16} className="fill-yellow text-yellow" />
        ))}
      </div>
      <p className="text-ink2 text-sm leading-relaxed italic font-lora">"{review.text}"</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center font-outfit font-bold text-ink text-sm">
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="font-outfit font-semibold text-sm text-ink">{review.name}</p>
          <p className="text-2xs text-muted font-outfit">{review.country}</p>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-yellow rounded-full flex items-center justify-center">
              <span className="font-outfit font-black text-ink text-sm">T</span>
            </div>
            <span className="font-outfit font-bold text-lg text-ink">Tuk & Roll</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-outfit text-ink2">
            <a href="#tours" className="hover:text-ink transition-colors">Tours</a>
            <a href="#about" className="hover:text-ink transition-colors">Sobre</a>
            <a href="#reviews" className="hover:text-ink transition-colors">Avaliações</a>
            <a href="#contact" className="hover:text-ink transition-colors">Contacto</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-4 py-2 rounded-btn font-outfit font-semibold text-sm hover:bg-green/90 transition-colors flex items-center gap-2"
            >
              <MessageCircle size={16} /> Reservar
            </a>
            <Link to="/login" className="text-sm font-outfit text-muted hover:text-ink transition-colors">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow/20 text-ink2 px-4 py-2 rounded-full text-sm font-outfit mb-6">
            <MapPin size={14} className="text-copper" />
            <span>Lisboa, Portugal</span>
          </div>
          <h1 className="font-outfit font-black text-4xl sm:text-6xl lg:text-7xl text-ink leading-tight">
            Descubra Lisboa<br />
            <span className="text-copper">num TukTuk</span>
          </h1>
          <p className="font-outfit text-lg sm:text-xl text-ink2 mt-6 max-w-2xl mx-auto leading-relaxed">
            Tours privados e autênticos pelas ruas e miradouros mais bonitos de Lisboa.
            Uma experiência única no nosso TukTuk amarelo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <a
              href="#tours"
              className="bg-yellow text-ink px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-yellow/90 transition-colors shadow-card-md"
            >
              Ver Tours
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-green/90 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} /> Reservar via WhatsApp
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12 text-sm font-outfit text-muted">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow text-yellow" />
                ))}
              </div>
              <span>5.0 no Google</span>
            </div>
            <span className="text-line">|</span>
            <span>Tours privados</span>
            <span className="text-line">|</span>
            <span>Desde 60€</span>
          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section id="tours" className="py-16 sm:py-24 px-4 sm:px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">Os Nossos Tours</h2>
            <p className="font-outfit text-ink2 mt-3 max-w-xl mx-auto">
              Três percursos únicos para descobrir cada faceta de Lisboa. Escolha o seu favorito ou combine vários!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 bg-white rounded-card shadow-card px-6 py-3 text-sm font-outfit text-ink2">
              <span className="text-lg">💡</span>
              <span><strong>Pack desconto:</strong> Reserve 2 tours e ganhe 10% de desconto. 3 tours = 15% desconto!</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-outfit font-bold text-3xl text-ink">Sobre a Tuk & Roll</h2>
              <div className="mt-6 space-y-4 text-ink2 font-outfit leading-relaxed">
                <p>
                  Olá! Eu sou o Joaquim, o ruivo do TukTuk amarelo de Lisboa.
                  Nasci e cresci nesta cidade e conheço cada rua, cada miradouro, cada história escondida.
                </p>
                <p>
                  A Tuk & Roll nasceu de uma paixão simples: mostrar a Lisboa autêntica a quem nos visita.
                  Não os sítios que toda a gente conhece, mas os recantos especiais que fazem desta cidade única.
                </p>
                <p>
                  Cada tour é privado e personalizado. Paramos onde quiser, tiramos fotos nos melhores spots,
                  e pelo caminho conto-vos as histórias que nenhum guia turístico conta.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow/30 to-copper/10 rounded-card p-8 text-center">
              <div className="text-7xl mb-4">🛺</div>
              <h3 className="font-outfit font-bold text-xl text-ink">O TukTuk Amarelo</h3>
              <p className="text-ink2 text-sm mt-2 font-outfit">
                O nosso TukTuk amarelo é impossível de não reparar!
                Confortável para até 3 passageiros, perfeito para casais, famílias e amigos.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">3</div>
                  <div className="text-2xs text-muted font-outfit">Lugares</div>
                </div>
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">3</div>
                  <div className="text-2xs text-muted font-outfit">Tours</div>
                </div>
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">100%</div>
                  <div className="text-2xs text-muted font-outfit">Privado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-16 sm:py-24 px-4 sm:px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">O que dizem os nossos clientes</h2>
            <p className="font-outfit text-ink2 mt-3">100% de avaliações 5 estrelas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-ink">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-cream">
            Pronto para descobrir Lisboa?
          </h2>
          <p className="font-outfit text-cream/70 mt-4 text-lg">
            Reserve o seu tour agora via WhatsApp. Resposta em menos de 1 hora!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green text-white px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-green/90 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} /> Reservar via WhatsApp
            </a>
            <a
              href="tel:+351910000000"
              className="bg-cream/10 text-cream border border-cream/20 px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-cream/20 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={20} /> Ligar Agora
            </a>
          </div>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="py-12 px-4 sm:px-6 bg-ink border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-yellow rounded-full flex items-center justify-center">
                  <span className="font-outfit font-black text-ink text-sm">T</span>
                </div>
                <span className="font-outfit font-bold text-lg text-cream">Tuk & Roll</span>
              </div>
              <p className="text-cream/60 text-sm font-outfit">
                Tours de TukTuk em Lisboa.<br />
                Experiências privadas e autênticas.
              </p>
            </div>
            <div>
              <h3 className="font-outfit font-semibold text-cream mb-3">Contactos</h3>
              <div className="space-y-2 text-sm font-outfit text-cream/60">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cream transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a href="mailto:ops@tukanapp.pt" className="flex items-center gap-2 hover:text-cream transition-colors">
                  <Mail size={14} /> ops@tukanapp.pt
                </a>
                <a href="tel:+351910000000" className="flex items-center gap-2 hover:text-cream transition-colors">
                  <Phone size={14} /> +351 910 000 000
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-outfit font-semibold text-cream mb-3">Siga-nos</h3>
              <div className="space-y-2 text-sm font-outfit text-cream/60">
                <a href="https://instagram.com/tukandroll" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cream transition-colors">
                  <Instagram size={14} /> @tukandroll
                </a>
              </div>
              <div className="mt-6">
                <h3 className="font-outfit font-semibold text-cream mb-3">Para operadores</h3>
                <Link to="/login" className="text-sm font-outfit text-cream/60 hover:text-cream transition-colors">
                  Aceder ao painel de gestão →
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-cream/40 text-sm font-outfit">
            <p>© {new Date().getFullYear()} Tuk & Roll — Tours de TukTuk em Lisboa. Todos os direitos reservados.</p>
            <p className="mt-1">Powered by <a href="https://www.tukanapp.pt" className="text-yellow/60 hover:text-yellow transition-colors">Tuk an App</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
