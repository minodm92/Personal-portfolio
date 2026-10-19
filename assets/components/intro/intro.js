import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRevealWithin } from '../../common/reveal.js';

gsap.registerPlugin(ScrollTrigger);

function syncIntroLabelSpacing(intro) {
    const startLabel = intro?.querySelector('.intro__label--start');
    const title = intro?.querySelector('#intro-title');
    if (!intro || !startLabel || !title) return () => {};

    const desktop = window.matchMedia('(min-width: 64rem)');
    const update = () => {
        if (!desktop.matches) {
            intro.style.removeProperty('--intro-end-label-top');
            return;
        }

        const introRect = intro.getBoundingClientRect();
        const startRect = startLabel.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const labelToCopyGap = Math.max(0, titleRect.top - startRect.bottom);

        intro.style.setProperty(
            '--intro-end-label-top',
            `${titleRect.bottom - introRect.top + labelToCopyGap}px`
        );
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(intro);
    observer?.observe(startLabel);
    observer?.observe(title);
    desktop.addEventListener?.('change', update);
    window.addEventListener('resize', update, { passive: true });
    document.fonts?.ready.then(update);
    update();

    return () => {
        observer?.disconnect();
        desktop.removeEventListener?.('change', update);
        window.removeEventListener('resize', update);
        intro.style.removeProperty('--intro-end-label-top');
    };
}

function splitLinesIntoCharacters(title, lines) {
    const originalLabel = title.getAttribute('aria-label');
    const originals = [...lines].map((line) => line.textContent ?? '');
    const segmenter =
        typeof Intl.Segmenter === 'function'
            ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
            : null;
    const characters = [];

    title.setAttribute('aria-label', originals.join(' ').trim());

    lines.forEach((line, lineIndex) => {
        const segments = segmenter
            ? [...segmenter.segment(originals[lineIndex])].map(({ segment }) => segment)
            : Array.from(originals[lineIndex]);
        const fragment = document.createDocumentFragment();

        line.setAttribute('aria-hidden', 'true');

        segments.forEach((character) => {
            if (/^\s+$/u.test(character)) {
                fragment.append(document.createTextNode(character));
                return;
            }

            const characterElement = document.createElement('span');
            characterElement.className = 'intro__char';
            characterElement.textContent = character;
            fragment.append(characterElement);
            characters.push(characterElement);
        });

        line.replaceChildren(fragment);
    });

    return {
        characters,
        restore() {
            lines.forEach((line, lineIndex) => {
                line.textContent = originals[lineIndex];
                line.removeAttribute('aria-hidden');
            });

            if (originalLabel === null) title.removeAttribute('aria-label');
            else title.setAttribute('aria-label', originalLabel);
        },
    };
}

function initProfileSticker(viewport, intro) {
    const sticker = intro?.querySelector('[data-profile-sticker]');
    const tape = intro?.querySelector('[data-whoami-tape]');
    const cat = intro?.querySelector('[data-cat-sticker]');
    const catFront = intro?.querySelector('[data-cat-sticker-front]');
    if (!viewport || !intro || !sticker || !tape || !cat || !catFront) return () => {};

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const restingShadow = 'drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.2)) drop-shadow(0px 1px 1.5px rgba(0, 0, 0, 0.18))';

    if (prefersReducedMotion) {
        gsap.set(sticker, { autoAlpha: 1, y: 0, scale: 1, filter: restingShadow });
        gsap.set(tape, { autoAlpha: 1, y: 0, scaleX: 1, scaleY: 1, rotation: 0, clipPath: 'inset(0 0% 0 0)', filter: 'none' });
        gsap.set(cat, { autoAlpha: 1, xPercent: 0 });
        gsap.set(catFront, { autoAlpha: 1, xPercent: 0, clipPath: 'inset(0 7.2% 0 0)' });
        return () => {
            gsap.set(sticker, { clearProps: 'opacity,visibility,transform,filter' });
            gsap.set(tape, { clearProps: 'opacity,visibility,transform,clipPath,filter' });
            gsap.set(cat, { clearProps: 'opacity,visibility,transform' });
            gsap.set(catFront, { clearProps: 'opacity,visibility,transform,clipPath' });
        };
    }

    gsap.set(sticker, {
        autoAlpha: 0,
        y: -150,
        scale: 1.8,
        filter: 'drop-shadow(0px 40px 20px rgba(0, 0, 0, 0.05))',
        willChange: 'transform,opacity,filter',
    });

    gsap.set(tape, {
        autoAlpha: 0,
        y: -24,
        scaleX: 0.08,
        scaleY: 1.12,
        rotation: -12,
        clipPath: 'inset(0 92% 0 0)',
        filter: 'drop-shadow(0px 18px 10px rgba(0, 0, 0, 0.12))',
        willChange: 'transform,opacity,clip-path,filter',
    });

    // 빨간 세로선 뒤에 숨겨 두었다가 테이프와 함께 왼쪽으로 내민다.
    gsap.set(cat, {
        autoAlpha: 0,
        xPercent: 95,
        willChange: 'transform,opacity',
    });
    gsap.set(catFront, {
        autoAlpha: 0,
        xPercent: 95,
        clipPath: 'inset(0 100% 0 0)',
        willChange: 'transform,opacity,clip-path',
    });

    const setMotionHints = () => {
        gsap.set(sticker, { willChange: 'transform,opacity,filter' });
        gsap.set(tape, { willChange: 'transform,opacity,clip-path,filter' });
        gsap.set(cat, { willChange: 'transform,opacity' });
        gsap.set(catFront, { willChange: 'transform,opacity,clip-path' });
    };

    const clearMotionHints = () => {
        gsap.set(sticker, { clearProps: 'willChange' });
        gsap.set(tape, { clearProps: 'willChange' });
        gsap.set(cat, { clearProps: 'willChange' });
        gsap.set(catFront, { clearProps: 'willChange' });
    };

    const introTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: intro,
            start: 'center center',
            end: () => `+=${Math.max(window.innerHeight * 1.65, 1100)}`,
            pin: viewport,
            pinSpacing: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onEnter: setMotionHints,
            onEnterBack: setMotionHints,
            onLeave: clearMotionHints,
            onLeaveBack: clearMotionHints,
        },
    });

    introTimeline
        .to({}, { duration: 0.5 })
        .to(sticker, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: restingShadow,
            duration: 0.35,
            ease: 'power3.out',
        })
        .addLabel('tapeAndCat')
        .to(tape, {
            autoAlpha: 1,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            clipPath: 'inset(0 0% 0 0)',
            filter: 'drop-shadow(0px 2px 1px rgba(0, 0, 0, 0.14))',
            duration: 0.45,
            ease: 'none',
        }, 'tapeAndCat')
        .to(cat, {
            autoAlpha: 1,
            xPercent: 0,
            duration: 0.45,
            ease: 'none',
        }, 'tapeAndCat')
        .to(catFront, {
            autoAlpha: 1,
            xPercent: 0,
            clipPath: 'inset(0 7.2% 0 0)',
            duration: 0.45,
            ease: 'none',
        }, 'tapeAndCat')
        .to({}, { duration: 0.5 });

    return () => {
        introTimeline.scrollTrigger?.kill();
        introTimeline.kill();
        gsap.set(sticker, { clearProps: 'opacity,visibility,transform,filter,willChange' });
        gsap.set(tape, { clearProps: 'opacity,visibility,transform,clipPath,filter,willChange' });
        gsap.set(cat, { clearProps: 'opacity,visibility,transform,willChange' });
        gsap.set(catFront, { clearProps: 'opacity,visibility,transform,clipPath,willChange' });
    };
}

function initIntroTwoHighlights(section, reduceMotion) {
    const cards = section?.querySelector('.intro-2-figma__cards');
    const highlights = gsap.utils.toArray('[data-highlight-step]', section);
    if (!section || !cards || !highlights.length) return () => {};

    if (reduceMotion.matches) {
        gsap.set(highlights, { '--highlight-progress': 1 });
        return () => gsap.set(highlights, { clearProps: '--highlight-progress' });
    }

    const steps = [...new Set(highlights.map((highlight) => highlight.dataset.highlightStep))]
        .map((step) => highlights.filter((highlight) => highlight.dataset.highlightStep === step));

    gsap.set(highlights, {
        '--highlight-progress': 0,
        willChange: 'transform',
    });

    const timeline = gsap.timeline({
        scrollTrigger: {
            trigger: cards,
            start: 'center center',
            end: () => `+=${Math.max(window.innerHeight * 2.2, 1600)}`,
            pin: section,
            pinSpacing: true,
            scrub: 0.8,
            once: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onLeave: () => gsap.set(highlights, { clearProps: 'willChange' }),
        },
    });

    timeline.to({}, { duration: 0.5 });
    steps.forEach((stepHighlights) => {
        timeline.to(stepHighlights, {
            '--highlight-progress': 1,
            duration: 0.3,
            ease: 'none',
        });
    });
    timeline.to({}, { duration: 0.5 });

    return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        gsap.set(highlights, { clearProps: '--highlight-progress,willChange' });
    };
}

export function initIntro({ reduceMotion }) {
    const sequence = document.querySelector('[data-intro-timeline]');
    const viewport = sequence?.querySelector('[data-intro-viewport]');
    const intro = sequence?.querySelector('.intro');
    const introTwo = sequence?.querySelector('[data-intro-two]');
    const destroyIntroLabelSpacing = syncIntroLabelSpacing(intro);
    const destroyProfileSticker = initProfileSticker(viewport, intro);
    const destroyIntroTwoHighlights = initIntroTwoHighlights(introTwo, reduceMotion);
    initRevealWithin(intro, reduceMotion);
    if (!sequence || !viewport || !intro) return;

    if (intro.matches('.intro--profile')) {
        return () => {
            destroyIntroLabelSpacing();
            destroyProfileSticker();
            destroyIntroTwoHighlights();
        };
    }

    const title = intro.querySelector('h2');
    const lines = title?.querySelectorAll(':scope > span') ?? [];
    if (!title || !lines.length) return;

    if (reduceMotion.matches) {
        sequence.classList.add('intro-timeline--static');
        gsap.set(lines, { color: '#11100d' });
        return () => {
            destroyIntroLabelSpacing();
            destroyIntroTwoHighlights();
            sequence.classList.remove('intro-timeline--static');
        };
    }

    const { characters, restore } = splitLinesIntoCharacters(title, lines);
    const characterDuration = 1 / Math.max(characters.length, 1);
    gsap.set(lines, { color: '#bdb49b' });
    gsap.set(characters, { color: '#bdb49b' });

    const introTimeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
            trigger: viewport,
            start: 'top top',
            end: () => `+=${Math.max(window.innerHeight, intro.offsetHeight) * 1.5}`,
            pin: viewport,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 2,
        },
    });

    introTimeline.to(
        characters,
        {
            color: '#11100d',
            duration: characterDuration,
            stagger: { each: characterDuration },
        },
        0
    );

    let isActive = true;
    const refreshScrollTrigger = () => {
        if (isActive) ScrollTrigger.refresh();
    };

    document.fonts?.ready.then(refreshScrollTrigger);
    window.addEventListener('load', refreshScrollTrigger, { once: true });

    return () => {
        isActive = false;
        destroyIntroLabelSpacing();
        destroyIntroTwoHighlights();
        window.removeEventListener('load', refreshScrollTrigger);
        introTimeline.scrollTrigger?.kill();
        introTimeline.kill();
        gsap.set([...lines, ...characters], { clearProps: 'color' });
        restore();
    };
}
