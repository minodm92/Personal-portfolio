const DEFAULT_SPEED = 0.8;

function canScrollWithin(element, delta) {
    let current = element instanceof Element ? element : null;

    while (current && current !== document.body) {
        const { overflowY } = getComputedStyle(current);
        const isScrollable =
            /(auto|scroll)/.test(overflowY) && current.scrollHeight > current.clientHeight;

        if (isScrollable) {
            const canMoveUp = delta < 0 && current.scrollTop > 0;
            const canMoveDown =
                delta > 0 && current.scrollTop + current.clientHeight < current.scrollHeight;
            if (canMoveUp || canMoveDown) return true;
        }

        current = current.parentElement;
    }

    return false;
}

export function initScrollSpeed(speed = DEFAULT_SPEED) {
    const scrollingElement = document.scrollingElement;
    if (!scrollingElement || !window.matchMedia('(pointer: fine)').matches) return () => {};

    const onWheel = (event) => {
        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
            canScrollWithin(event.target, event.deltaY)
        )
            return;

        const unit =
            event.deltaMode === WheelEvent.DOM_DELTA_LINE
                ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
                : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                  ? window.innerHeight
                  : 1;

        event.preventDefault();
        scrollingElement.scrollTop += event.deltaY * unit * speed;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
}
