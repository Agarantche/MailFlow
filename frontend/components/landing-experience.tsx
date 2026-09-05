"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, Check, ChevronDown, CornerDownRight, Leaf, Mail, Menu, Pause, Play, Search, ShieldCheck, Sparkles, Wind, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LeafScene } from "@/frontend/components/leaf-scene";
import { MailFlowMark } from "@/frontend/components/mailflow-mark";
import styles from "./landing-experience.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const features = [
  { title: "Find your focus.", summary: "The important things rise to the top.", body: "See what needs a reply, what can wait, and what deserves a closer look. Make your next move with a little more clarity.", icon: Search },
  { title: "Find your words.", summary: "A thoughtful first draft. In your hands.", body: "Start with a suggested reply, give it your voice, and save it as a draft. The final word is always yours.", icon: Mail },
  { title: "Find your space.", summary: "A realistic day, with room around it.", body: "Bring your tasks, deadlines, and commitments together. Explore a plan that fits the hours you actually have.", icon: Wind }
];

const moments = [
  { initials: "MT", sender: "Maya Thompson", category: "Worth your attention", subject: "A quick check before Friday", message: "Hey! Could you look over the launch brief before Friday? I’ve highlighted the two decisions we still need to make. Everything else is ready to go.", summary: "Two decisions to review before Friday. The rest of the launch brief is ready.", action: "Review the highlighted decisions", color: "green" },
  { initials: "JL", sender: "Jamie Lee", category: "A little help with the reply", subject: "Coffee next week?", message: "It was so nice catching up at the studio. Are you around for coffee next Tuesday or Thursday? No rush—just let me know what works.", summary: "Jamie would like to meet for coffee next Tuesday or Thursday. A short reply will do.", action: "Check your calendar, then draft a reply", color: "gold" },
  { initials: "ST", sender: "The Studio", category: "Save it for a quieter moment", subject: "This week in the studio", message: "A new collection, a few notes from our makers, and a playlist for slow afternoons. Here’s what’s been happening in the studio this week.", summary: "A studio newsletter with new work and a playlist. No response needed.", action: "Read when you have a moment", color: "blue" }
];

const faqs = [
  ["What does MailFlow actually do?", "MailFlow brings recent unread Gmail messages into one workspace, summarizes them, highlights priorities and possible risks, and helps you draft replies. The day planner lets you turn an editable set of tasks into a schedule."],
  ["Can I explore without connecting my email?", "Yes. The demo inbox and day planner use fictional sample data and work without an account or API key. You can explore the experience before connecting Gmail."],
  ["Will MailFlow send emails for me?", "MailFlow’s actions create drafts. You review the words and send from Gmail when you’re ready. MailFlow does not automatically send your replies."],
  ["Is the day planner connected to my inbox?", "The planner currently uses editable sample tasks or scenarios you import. You can change the estimates, add your own tasks, and export a calendar file. Automatic extraction from your live inbox is not yet connected."]
];

export function LandingExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feature, setFeature] = useState(0);
  const [compact, setCompact] = useState(false);
  const [moment, setMoment] = useState(0);
  const [sampleView, setSampleView] = useState<"original" | "clarity">("clarity");
  const current = moments[moment];

  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-hero-copy] > *", { y: 26, opacity: 0, duration: 1.2, stagger: .11, ease: "power3.out", delay: .15 });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, { y: 36, opacity: 0, duration: 1.05, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      });
      gsap.fromTo("[data-breath-word]", { opacity: .2 }, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: "[data-breath-text]", start: "top 83%", end: "bottom 48%", scrub: .6 } });
      gsap.to("[data-hero-atmosphere]", { yPercent: 16, ease: "none", scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: .8 } });
    });
    media.add("(min-width: 1100px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.create({ trigger: "[data-story]", start: "top 120px", end: "bottom bottom-=60", pin: "[data-story-title]", pinSpacing: false });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <div ref={root} className={styles.site}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="MailFlow home"><MailFlowMark /><span>mailflow</span></Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <a href="#a-lighter-day">A lighter day</a><a href="#your-inbox">The experience</a><Link href="/lab">Day planner <ArrowDownRight size={13} /></Link>
        </nav>
        <div className={styles.headerRight}><Link className={styles.loginLink} href="/connect">Connect Gmail</Link><Link className={styles.navCta} href="/api/demo/start">Try MailFlow <ArrowRight size={14} /></Link><button className={styles.menuButton} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
        {menuOpen && <nav id="mobile-navigation" className={styles.mobileNav} aria-label="Mobile navigation"><a href="#a-lighter-day" onClick={() => setMenuOpen(false)}>A lighter day</a><a href="#your-inbox" onClick={() => setMenuOpen(false)}>The experience</a><Link href="/lab">Day planner</Link><Link href="/connect">Connect Gmail</Link></nav>}
      </header>

      <main id="main-content" className={styles.main}>
        <section className={styles.hero} data-hero aria-labelledby="hero-heading">
          <div className={styles.atmosphere} data-hero-atmosphere><div className={styles.sunlight} /><LeafScene paused={paused} interactive variant="hero" /></div>
          <div className={styles.heroWash} aria-hidden="true" />
          <div className={styles.heroContent} data-hero-copy>
            <p className={styles.heroIntro}>A little room to breathe.</p>
            <h1 id="hero-heading">Less inbox.<br /><span>More life.</span></h1>
            <p className={styles.heroDescription}>Let the noise settle. Find what matters.<br />Make space for everything beyond your inbox.</p>
            <div className={styles.heroActions}><Link className={styles.primaryButton} href="/api/demo/start">Find your calm <ArrowUpRightIcon /></Link><a className={styles.lightButton} href="#your-inbox">Take a look <ArrowDown size={16} /></a></div>
          </div>
          <div className={styles.heroBottom}><a href="#a-lighter-day" className={styles.scrollCue}><span><ArrowDown size={16} /></span>A clearer day is just below</a><div className={styles.breezeControl}><span>Move gently. The leaves will follow.</span><button aria-label={paused ? "Resume leaf animation" : "Pause leaf animation"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button></div></div>
          <div className={styles.heroEdge} aria-hidden="true" />
        </section>

        <section id="a-lighter-day" className={styles.breatheSection}>
          <div className={styles.breatheText} data-breath-text>
            {"Your inbox is a place you visit.".split(" ").map((word, index) => <span key={`first-${index}`} data-breath-word>{word} </span>)}
            <span className={styles.inlineImage}><Image src="/leaf-study.svg" alt="Sunlight falling on green leaves" fill sizes="150px" /></span>{" It shouldn’t be a place you live.".split(" ").map((word, index) => <span key={`second-${index}`} data-breath-word>{word} </span>)}
          </div>
          <p data-reveal>MailFlow helps you clear the mental clutter, one thoughtful decision at a time.</p>
        </section>

        <section className={styles.featuresSection} aria-labelledby="features-heading">
          <div className={styles.featureHeading} data-reveal><h2 id="features-heading">A lighter way<br />through your day.</h2><p>Less sorting. Less second-guessing.<br />A little more space to think.</p></div>
          <div className={styles.accordion}>
            {features.map((item, index) => {
              const Icon = item.icon;
              return <article className={`${styles.featureCard} ${feature === index ? styles.featureActive : ""}`} key={item.title} onMouseEnter={() => { if (!compact) setFeature(index); }}>
                <button className={styles.featureTrigger} aria-expanded={compact ? feature === index : undefined} aria-pressed={compact ? undefined : feature === index} aria-controls={`feature-content-${index}`} onClick={() => setFeature(compact && feature === index ? -1 : index)}><span><Icon size={22} strokeWidth={1.4} /></span><span>{item.title}</span><ArrowDownRight size={22} /></button>
                <div className={styles.featureBody} id={`feature-content-${index}`}><p className={styles.featureSummary}>{item.summary}</p><div className={styles.featureIllustration} aria-hidden="true">{index === 0 ? <FocusIllustration /> : index === 1 ? <DraftIllustration /> : <PlanIllustration />}</div><p>{item.body}</p><Link href={index === 2 ? "/lab" : "/api/demo/start"}>Explore {index === 0 ? "your inbox" : index === 1 ? "thoughtful drafts" : "the day planner"} <ArrowRight size={15} /></Link></div>
              </article>;
            })}
          </div>
        </section>

        <section id="your-inbox" className={styles.experienceSection} aria-labelledby="experience-heading">
          <div className={styles.experienceHeading} data-reveal><span className={styles.smallLeaf}><Leaf size={24} strokeWidth={1.1} /></span><h2 id="experience-heading">A little clarity changes everything.</h2><p>A few moments from a sample inbox. Try seeing them a different way.</p></div>
          <div className={styles.inboxDemo} data-reveal>
            <aside className={styles.demoSidebar}><div className={styles.demoBrand}><MailFlowMark className="size-6" /><strong>mailflow</strong></div><span className={styles.demoFolder}><Mail size={15} />Your inbox <span>3</span></span><div className={styles.demoSenderList}>{moments.map((item, index) => <button key={item.subject} className={index === moment ? styles.activeSender : ""} onClick={() => setMoment(index)} aria-pressed={index === moment}><span className={styles.avatar} data-color={item.color}>{item.initials}</span><span><strong>{item.sender}</strong><small>{item.subject}</small></span></button>)}</div><div className={styles.demoFoot}><span />A little less on your mind</div></aside>
            <div className={styles.demoMessage}>
              <div className={styles.messageHeader}><span>Sample inbox</span><div className={styles.messageSwitch} role="group" aria-label="Sample message view"><button aria-pressed={sampleView === "original"} onClick={() => setSampleView("original")}>Original</button><button aria-pressed={sampleView === "clarity"} onClick={() => setSampleView("clarity")}>With MailFlow <Sparkles size={12} /></button></div></div>
              <div className={styles.messageContent} aria-live="polite"><div className={styles.senderLine}><span className={styles.avatar} data-color={current.color}>{current.initials}</span><div><strong>{current.sender}</strong><span>to you</span></div><span>Just now</span></div><h3>{current.subject}</h3>{sampleView === "original" ? <p className={styles.originalMessage}>{current.message}</p> : <><div className={styles.clarityNote}><span><Sparkles size={14} />{current.category}</span><p>{current.summary}</p></div><div className={styles.nextStep}><CornerDownRight size={16} /><div><small>Your next step</small><p>{current.action}</p></div><Check size={17} /></div></>}</div>
              <div className={styles.carouselControls}><span>{moment + 1} <span>/ {moments.length}</span></span><div><button aria-label="Previous sample email" onClick={() => setMoment((moment + moments.length - 1) % moments.length)}><ArrowLeft size={17} /></button><button aria-label="Next sample email" onClick={() => setMoment((moment + 1) % moments.length)}><ArrowRight size={17} /></button></div></div>
            </div>
          </div>
          <Link className={styles.understatedLink} href="/api/demo/start">Step into the demo inbox <ArrowRight size={16} /></Link>
        </section>

        <section className={styles.storySection} data-story>
          <div className={styles.storyTitle} data-story-title><div className={styles.storyLeaf}><Leaf size={30} strokeWidth={1} /></div><h2>Your attention<br />is a good thing.<br /><span>Let’s look after it.</span></h2><p>A thoughtful assistant should leave you with more room, and more say.</p><Link className={styles.lightButton} href="/connect">Meet your quieter inbox <ArrowRight size={15} /></Link></div>
          <div className={styles.storyChapters}>
            <article data-reveal><div className={styles.chapterArt} data-art="focus"><div className={styles.ripple} /><div className={styles.focusLeaf}><Leaf size={72} strokeWidth={.8} /></div><span>One thing at a time.</span></div><h3>Clarity over more noise.</h3><p>A useful summary, a clear priority, a considered next step. Enough context to decide without reading the same thread three times.</p></article>
            <article data-reveal><div className={styles.chapterArt} data-art="control"><div className={styles.controlPaper}><span>Sounds good. Let’s make it happen.</span><span><Check size={12} />Saved as a draft</span></div><span className={styles.controlHand}><ShieldCheck size={27} strokeWidth={1.1} /></span></div><h3>A helping hand. Your final word.</h3><p>Suggestions are a starting point. Edit a reply, leave it for later, or save it as a Gmail draft. You choose what goes out.</p></article>
            <article data-reveal><div className={styles.chapterArt} data-art="space"><div className={styles.dayTimeline}><span>Finish the important thing</span><i /><span>Room for the unexpected</span><i /><span>Close the laptop <Leaf size={15} /></span></div></div><h3>A plan that leaves room for life.</h3><p>See what fits around your commitments. Give your estimates a buffer. When everything can’t fit, understand what has to give.</p><Link href="/lab" className={styles.understatedLink}>Make space for your day <ArrowRight size={15} /></Link></article>
          </div>
        </section>

        <section className={styles.questions} aria-labelledby="questions-heading"><div data-reveal><h2 id="questions-heading">A few things<br />you might be wondering.</h2><p>Getting comfortable should be simple.</p></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div></section>

        <section className={styles.finalCta}>
          <LeafScene variant="ambient" paused={paused} />
          <div className={styles.finalCopy} data-reveal><span className={styles.ctaLeaf}><Leaf size={32} strokeWidth={1.1} /></span><h2>Take a breath.<br />Start fresh.</h2><p>Your inbox will still be there.<br />It can just feel a little lighter.</p><Link className={styles.primaryButton} href="/api/demo/start">Find your calm <ArrowUpRightIcon /></Link><span className={styles.ctaNote}>Try the demo. No account needed.</span></div>
        </section>
      </main>

      <footer className={styles.footer}><Link className={styles.brand} href="/"><MailFlowMark /><span>mailflow</span></Link><p>Less inbox. More life.</p><nav aria-label="Footer navigation"><Link href="/api/demo/start">Try the inbox</Link><Link href="/lab">Day planner</Link><Link href="/connect">Connect Gmail</Link></nav><span>Made for a little more breathing room.</span></footer>
    </div>
  );
}

function ArrowUpRightIcon() { return <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

function FocusIllustration() {
  return <div className={styles.focusIllustration}><div><span className={styles.miniAvatar}>M</span><span><strong>A quick check before Friday</strong><small>Worth your attention</small></span><span className={styles.miniDot} /></div><div><span className={styles.miniAvatar}>S</span><span><strong>Your weekly inspiration</strong><small>For a quieter moment</small></span></div><div><span className={styles.miniAvatar}>J</span><span><strong>Thanks for yesterday</strong><small>A thoughtful reply</small></span></div></div>;
}
function DraftIllustration() {
  return <div className={styles.draftIllustration}><span><Sparkles size={13} /> A place to start</span><p>Hi Maya,<br />Thanks for sharing this. I’ll take a look at the two decisions and get back to you before Friday.</p><div><span>Make it yours</span><span><Check size={12} /> Draft</span></div></div>;
}
function PlanIllustration() {
  return <div className={styles.planIllustration}><div><span>09:00</span><span>One important thing <Check size={12} /></span></div><div><span>10:15</span><span>A moment to reset</span></div><div><span>10:30</span><span>A little progress <Check size={12} /></span></div><p><Leaf size={15} /> Room to breathe, built in.</p></div>;
}
