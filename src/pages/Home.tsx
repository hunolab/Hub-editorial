import { useEffect, useRef } from 'react';
import { BookOpen, PenTool, Users, Award, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/magicui/marquee";
import { TextReveal } from "@/components/ui/magicui/text-reveal";
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  {
    name: "Luiza",
    username: "@luizamlucena",
    body: "Amo publicar com a Literare",
    img: "https://i.ibb.co/21RnGpmg/2.png",
  },
  {
    name: "Thiago Castro",
    username: "@dr.thiagocastro",
    body: "Maior editora em autismo!",
    img: "https://i.ibb.co/9kQFrJsv/1.png",
  },
  {
    name: "Hiram",
    username: "@hirambaroli",
    body: "Revisão de primeira!",
    img: "https://i.ibb.co/MkZyYCDw/3.png",
  },
  {
    name: "Lucedile",
    username: "@lucedileantunes",
    body: "Literare publica livros inspiradores.",
    img: "https://i.ibb.co/JWxybGm8/4.png",
  },
  {
    name: "Chris Pelajo",
    username: "@chrispelajooficial",
    body: "Editora com visão inovadora.",
    img: "https://i.ibb.co/bVthjK4/Chrispelajo.png",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);
const thirdRow = reviews.slice(0, reviews.length / 2);
const fourthRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-fit sm:w-36 cursor-pointer rounded-xl border p-4",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        "flex flex-col"
      )}
    >
      <div className="flex flex-row items-center gap-2 mb-2">
        <img className="rounded-full" width="32" height="32" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-sm dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="text-sm">
        {body}
      </blockquote>
    </figure>
  );
};

const Marquee3D = () => {
  return (
    <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:300px]">
      <div
        className="flex flex-row items-center gap-4 hero-marquee"
        style={{
          transform:
            "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
        }}
      >
        <Marquee pauseOnHover vertical className="[--duration:30s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s]" vertical>
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:30s]" vertical>
          {thirdRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee pauseOnHover className="[--duration:30s]" vertical>
          {fourthRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
};

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', bounce: 0.3, duration: 1.5 } },
  },
};

const AnimatedGroup = ({ children, variants, className }: any) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-title', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      
      gsap.fromTo('.hero-subtitle', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power3.out' }
      );

      gsap.fromTo('.hero-marquee', 
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, delay: 0.4, ease: 'power3.out' }
      );

      gsap.to('.hero-marquee', {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });

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
      {/* Fundo decorativo do Hero */}
      <div
        aria-hidden
        className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
      >
        <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>

      {/* Seção Hero */}
      <section>
        <div className="relative pt-24 md:pt-36">
          <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              <AnimatedGroup variants={transitionVariants}>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-soft text-primary text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Seja Autor(a)
                </span>
                <h1 className="heading-hero text-foreground">
                  Editorial
                  <span className="text-primary block">
                    Literare Books
                  </span>
                </h1>
                
                <p className="hero-subtitle body-lg text-muted-foreground max-w-xl mx-auto">
                  A Literare Books é uma editora moderna dedicada a descobrir e publicar 
                  novos talentos literários. Junte-se a nós nessa jornada criativa.
                </p>
              </AnimatedGroup>

              {/* BOTÕES REMOVIDOS AQUI */}
            </div>

            <div className="hero-marquee flex justify-center lg:justify-end mt-12">
              <div className="relative">
                <Marquee3D />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Features */}
      <section ref={featuresRef} className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <TextReveal className="my-custom-class">
              Por que escolher a Literare Books?
            </TextReveal>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma experiência editorial completa, do manuscrito à publicação, 
              com o suporte que todo autor merece.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card p-6 text-center border rounded-lg hover:shadow-lg transition-shadow">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção CTA */}
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
            <a href="/submit">
              <button className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-primary/90 transition">
                Começar Agora
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}