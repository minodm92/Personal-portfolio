import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initRevealWithin } from '../../common/reveal.js';

gsap.registerPlugin(ScrollTrigger);

function syncPaperTextMask(section) {
    const paper = section?.querySelector('.intro-2__paper--bridge');
    const paperImage = paper?.querySelector('img');
    if (!section || !paper) return () => {};

    const update = () => {
        const sectionRect = section.getBoundingClientRect();
        const paperRect = paper.getBoundingClientRect();
        section.style.setProperty('--intro-2-mask-x', `${paperRect.left - sectionRect.left}px`);
        section.style.setProperty('--intro-2-mask-y', `${paperRect.top - sectionRect.top}px`);
        section.style.setProperty('--intro-2-mask-width', `${paperRect.width}px`);
        section.style.setProperty('--intro-2-mask-height', `${paperRect.height}px`);
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(section);
    observer?.observe(paper);
    window.addEventListener('resize', update, { passive: true });
    paperImage?.addEventListener('load', update);
    update();

    return () => {
        observer?.disconnect();
        window.removeEventListener('resize', update);
        paperImage?.removeEventListener('load', update);
    };
}

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

function initIntroTwoCards(section, reduceMotion) {
    const cards = gsap.utils.toArray('[data-intro-two-card]', section);
    const cardInners = gsap.utils.toArray('[data-intro-two-card-inner]', section);
    if (!section || !cards.length || cards.length !== cardInners.length || reduceMotion.matches) {
        return () => {};
    }

    const media = gsap.matchMedia();

    media.add('(min-width: 64rem)', () => {
        const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: section,
                start: 'center center',
                end: () => `+=${Math.max(window.innerWidth * 2.4, window.innerHeight * 3)}`,
                pin: true,
                pinSpacing: true,
                scrub: 0.8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                refreshPriority: 1,
            },
        });

        timeline.fromTo(
            cards,
            { x: () => window.innerWidth * 1.15, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.7,
                ease: 'power2.out',
            }
        );

        timeline.add('card-flip', '+=0.35');

        cardInners.forEach((cardInner, index) => {
            const flipPosition = `card-flip+=${index * 0.3}`;

            timeline.to(
                cardInner,
                {
                    rotationY: 180,
                    duration: 1,
                    ease: 'power2.inOut',
                },
                flipPosition
            );
        });

        return () => {
            timeline.scrollTrigger?.kill();
            timeline.kill();
            gsap.set(cards, { clearProps: 'transform,opacity' });
            gsap.set(cardInners, { clearProps: 'transform' });
        };
    });

    return () => media.revert();
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

export function initIntro({ reduceMotion }) {
    const sequence = document.querySelector('[data-intro-timeline]');
    const viewport = sequence?.querySelector('[data-intro-viewport]');
    const intro = sequence?.querySelector('.intro');
    const introTwo = sequence?.querySelector('[data-intro-two]');
    const destroyPaperTextMask = syncPaperTextMask(introTwo);
    const destroyIntroLabelSpacing = syncIntroLabelSpacing(intro);
    const destroyIntroTwoCards = initIntroTwoCards(introTwo, reduceMotion);
    initRevealWithin(intro, reduceMotion);
    if (!sequence || !viewport || !intro) return;

    const title = intro.querySelector('h2');
    const lines = title?.querySelectorAll(':scope > span') ?? [];
    if (!title || !lines.length) return;

    if (reduceMotion.matches) {
        sequence.classList.add('intro-timeline--static');
        gsap.set(lines, { color: '#11100d' });
        return () => {
            destroyPaperTextMask();
            destroyIntroLabelSpacing();
            destroyIntroTwoCards();
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
        destroyPaperTextMask();
        destroyIntroLabelSpacing();
        destroyIntroTwoCards();
        window.removeEventListener('load', refreshScrollTrigger);
        introTimeline.scrollTrigger?.kill();
        introTimeline.kill();
        gsap.set([...lines, ...characters], { clearProps: 'color' });
        restore();
    };
}
