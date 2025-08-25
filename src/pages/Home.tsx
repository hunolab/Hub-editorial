import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, PenTool, Users, Award, ArrowRight, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImage from '@/assets/hero-editorial.jpg';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo('.hero-title', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      
      gsap.fromTo('.hero-subtitle', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power3.out' }
      );
      
      gsap.fromTo('.hero-cta', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: 'power3.out' }
      );

      gsap.fromTo('.hero-image', 
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, delay: 0.6, ease: 'power3.out' }
      );

      // Features animation on scroll
      gsap.fromTo('.feature-card', 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // CTA section animation
      gsap.fromTo('.cta-content', 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Floating animation for hero image
      gsap.to('.hero-image', {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: PenTool,
      title: 'Submissão Simplificada',
      description: 'Envie seus capítulos através de um processo guiado e intuitivo, com validação em tempo real.'
    },
    {
      icon: Users,
      title: 'Colaboração Editorial',
      description: 'Trabalhe conosco em parceria, com feedback profissional e acompanhamento personalizado.'
    },
    {
      icon: Award,
      title: 'Qualidade Literária',
      description: 'Mantemos os mais altos padrões de qualidade editorial e curadoria de conteúdo.'
    },
    {
      icon: BookOpen,
      title: 'Publicação Profissional',
      description: 'Transformamos seu manuscrito em uma obra publicada com toda a infraestrutura necessária.'
    }
  ];

  return (
    <div ref={heroRef} className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="hero-title">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-soft text-primary text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Editorial Literária
                </span>
                <h1 className="heading-hero text-foreground">
                  Transforme sua 
                  <span className="text-primary block">
                    escrita em arte
                  </span>
                </h1>
              </div>
              
              <p className="hero-subtitle body-lg text-muted-foreground max-w-xl">
                A Literare Books é uma editora moderna dedicada a descobrir e publicar 
                novos talentos literários. Junte-se a nós nessa jornada criativa.
              </p>
            </div>

            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/submit">
                <Button className="btn-hero group">
                  Enviar seu Capítulo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="btn-outline-editorial">
                Saiba Mais
              </Button>
            </div>
          </div>

          <div className="hero-image flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-hero rounded-3xl blur-2xl opacity-20 scale-110"></div>
              <img 
                src={heroImage} 
                alt="Editorial Literare Books" 
                className="relative rounded-3xl shadow-hero max-w-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="heading-lg text-foreground">
              Por que escolher a Literare Books?
            </h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma experiência editorial completa, do manuscrito à publicação, 
              com o suporte que todo autor merece.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card card-editorial p-6 text-center hover:card-hover">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-primary-soft">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="heading-sm text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="body-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 bg-gradient-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="cta-content space-y-8">
            <h2 className="heading-lg text-foreground">
              Pronto para publicar sua história?
            </h2>
            <p className="body-lg text-muted-foreground">
              Inicie sua jornada conosco hoje mesmo. Envie seu primeiro capítulo 
              e descubra o potencial da sua escrita.
            </p>
            <Link to="/submit">
              <Button className="btn-hero text-lg px-8 py-4">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}