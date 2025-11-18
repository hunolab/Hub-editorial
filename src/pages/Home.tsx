// src/pages/Home.tsx
import { useEffect, useRef } from 'react';
import { BookOpen, PenTool, Users, Award, Sparkles, Star, Send, Mail, Phone, MapPin, Instagram, Linkedin, Youtube } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger, ScrollSmoother } from 'gsap/all';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const reviews = [
  { name: "Luiza", username: "@luizamlucena", body: "Amo publicar com a Literare", rating: 5 },
  { name: "Thiago Castro", username: "@dr.thiagocastro", body: "Maior editora em autismo!", rating: 5 },
  { name: "Hiram", username: "@hirambaroli", body: "Revisão de primeira!", rating: 5 },
  { name: "Lucedile", username: "@lucedileantunes", body: "Literare publica livros inspiradores.", rating: 5 },
  { name: "Chris Pelajo", username: "@chrispelajooficial", body: "Editora com visão inovadora.", rating: 5 },
];

export default function Home() {
  const cursorRef = useRef<HTMLDivElement>(null);

  // Cursor magnético suave
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX - 24,
          y: e.clientY - 24,
          duration: 0.9,
          ease: "power3.out",
        });
      }
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  // ScrollSmoother + orbes flutuantes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 2,
      effects: true,
      smoothTouch: 0.1,
    });

    gsap.to(".floating-orb", {
      y: -140,
      x: 100,
      rotation: 360,
      duration: 28,
      repeat: -1,
      yoyo: true,
      ease: "none",
      stagger: { each: 4, from: "random" },
    });
  }, []);

  return (
    <>
      {/* Cursor dourado */}
      <div
        ref={cursorRef}
        className="fixed w-12 h-12 bg-[#ffb319]/10 rounded-full pointer-events-none z-50 backdrop-blur-xl border border-[#ffb319]/40 hidden lg:block mix-blend-plus-lighter"
      />

      <div id="smooth-wrapper" className="bg-white text-black">
        <div id="smooth-content" className="font-outfit">

          {/* HERO */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Orbes dourados flutuantes */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="floating-orb absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
                style={{
                  background: "radial-gradient(circle at 40%, #ffb319, transparent 70%)",
                  top: `${10 + i * 15}%`,
                  left: i % 2 === 0 ? `${-20 + i * 20}%` : `${60 + i * 10}%`,
                }}
              />
            ))}

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
              >
                <div className="mb-10">
                  <span className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#ffb319]/10 text-[#ffb319] font-bold text-lg tracking-wider">
                    <Sparkles className="w-6 h-6" />
                    A editora que publica autores de verdade
                  </span>
                </div>

                <h1 className="text-8xl md:text-9xl font-black tracking-tighter mb-8 leading-none">
                  <span className="block text-black">Literare</span>
                  <span className="block text-[#ffb319]">Books</span>
                </h1>

                <p className="text-2xl md:text-3xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-16 font-light">
                  Publicação profissional • Curadoria exclusiva • Parceria real
                </p>

                <Button asChild size="lg" className="group text-2xl px-16 py-10 rounded-2xl bg-[#ffb319] hover:bg-[#e5a00e] text-black font-bold shadow-xl hover:shadow-2xl hover:shadow-[#ffb319]/40 transition-all duration-500">
                  <Link to="/submit" className="flex items-center gap-5">
                    Começar a Publicar
                    <Send className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="py-32">
            <div className="max-w-7xl mx-auto px-6">
              <motion.div className="text-center mb-24">
                <h2 className="text-6xl md:text-8xl font-black mb-8">
                  <span className="text-black">Por que autores escolhem</span><br />
                  <span className="text-[#ffb319]">a Literare</span>
                </h2>
                <p className="text-2xl text-gray-600 font-light max-w-4xl mx-auto">
                  Não é sobre publicar um livro. É sobre ser lido, lembrado e respeitado.
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-16">
                  {[
                    { icon: PenTool, title: "Submissão com Automação", desc: "FFormatação automática de referências bibliográficas com precisão" },
                    { icon: Users, title: "Editor Dedicado", desc: "Editor experiente revisa e lapida cada capítulo até a excelência" },
                    { icon: Award, title: "Curadoria Exclusiva", desc: "Revisão rigorosa em etapas para garantir padrão de excelência" },
                    { icon: BookOpen, title: "Distribuição Nacional", desc: "Seu livro em diversas livrarias físicas e digitais pelo Brasil" },
                  ].map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2 }}
                      viewport={{ once: true }}
                      className="group flex gap-8 p-8 rounded-3xl hover:bg-[#ffb319]/5 transition-all duration-500"
                    >
                      <div className="w-24 h-24 rounded-3xl bg-[#ffb319] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <f.icon className="w-12 h-12 text-black" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black mb-4">{f.title}</h3>
                        <p className="text-xl text-gray-700 leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-[#ffb319]/10 to-transparent rounded-3xl p-16 border border-[#ffb319]/20"
                >
                  <div className="text-center space-y-12">
                    <div className="text-9xl font-black text-[#ffb319]">2 Mil+</div>
                    <p className="text-4xl font-bold">Autores Publicados</p>
                    <div className="grid grid-cols-3 gap-12 pt-12 border-t border-gray-300">
                      <div><div className="text-6xl font-black">300+</div><p className="text-xl text-gray-700">Livros</p></div>
                      <div><div className="text-6xl font-black">N° 1</div><p className="text-x2 text-gray-700">Em Não Ficção</p></div>
                      <div><div className="text-6xl font-black">20+</div><p className="text-xl text-gray-700">Best-sellers</p></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* DEPOIMENTOS */}
          <section className="py-32 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-6xl md:text-8xl font-black text-center mb-24">
                <span className="text-black">O que nossos autores</span><br />
                <span className="text-[#ffb319]">dizem</span>
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {reviews.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 80 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -12 }}
                    className="p-10 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100"
                  >
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 rounded-full bg-[#ffb319] flex items-center justify-center text-black font-black text-2xl">
                        {r.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xl">{r.name}</p>
                        <p className="text-gray-600">{r.username}</p>
                      </div>
                    </div>
                    <div className="flex mb-6">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-6 h-6 fill-[#ffb319] text-[#ffb319]" />
                      ))}
                    </div>
                    <p className="text-xl italic text-gray-800 leading-relaxed">"{r.body}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-black text-white py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-12">
                <div>
                  <h3 className="text-4xl font-black mb-6">
                    Literare<span className="text-[#ffb319]"> Books</span>
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Transformando autores em referências a mais de 20 anos.
                  </p>
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-6">Links Rápidos</h4>
                  <ul className="space-y-4 text-gray-400">
                    <li><Link to="/submit" className="hover:text-[#ffb319] transition">Submeter Capítulo</Link></li>
                    <li><a href="https://loja.literarebooks.com.br/" className="hover:text-[#ffb319] transition">Nossos Livros</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-6">Contato</h4>
                  <ul className="space-y-4 text-gray-400">
                    <li className="flex items-center gap-3"><Mail className="w-5 h-5" />comunicacao@literarebooks.com.br</li>
                    <li className="flex items-center gap-3"><Phone className="w-5 h-5" /> (11) 2659-0964</li>
                    <li className="flex items-center gap-3"><MapPin className="w-5 h-5" /> São Paulo • Brasil</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xl font-bold mb-6">Redes Sociais</h4>
                  <div className="flex gap-6">
                    <a href="https://www.instagram.com/literarebooks/" className="w-12 h-12 rounded-full bg-[#ffb319] flex items-center justify-center hover:scale-110 transition">
                      <Instagram className="w-6 h-6 text-black" />
                    </a>
                    <a href="https://br.linkedin.com/company/literarebooks" className="w-12 h-12 rounded-full bg-[#ffb319] flex items-center justify-center hover:scale-110 transition">
                      <Linkedin className="w-6 h-6 text-black" />
                    </a>
                    <a href="https://www.youtube.com/watch?v=K-pjUohCq84&t=1s" className="w-12 h-12 rounded-full bg-[#ffb319] flex items-center justify-center hover:scale-110 transition">
                      <Youtube className="w-6 h-6 text-black" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-20 pt-10 border-t border-gray-800 text-center text-gray-500">
                <p>© 2025 Literare Books • Todos os direitos reservados
                  <br></br>
                <link rel="stylesheet" href="https://www.linkedin.com/company/termitdev" />Desenvolvido por TERMIT</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}