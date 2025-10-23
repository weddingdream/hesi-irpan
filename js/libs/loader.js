import { cache } from '../connection/cache.js';

/**
 * @param {ReturnType<typeof cache>} c
 * @returns {Promise<void>}
 */
const loadAOS = (c) => {

    const urlCss = 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css';
    const urlJs = 'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js';

    /**
     * @returns {Promise<void>}
     */
    const loadCss = () => c.get(urlCss).then((uri) => new Promise((res, rej) => {
        const link = document.createElement('link');
        link.onload = res;
        link.onerror = rej;

        link.rel = 'stylesheet';
        link.href = uri;
        document.head.appendChild(link);
    }));

    /**
     * @returns {Promise<void>}
     */
    const loadJs = () => c.get(urlJs).then((uri) => new Promise((res, rej) => {
        const sc = document.createElement('script');
        sc.onload = res;
        sc.onerror = rej;

        sc.src = uri;
        document.head.appendChild(sc);
    }));

    return Promise.all([loadCss(), loadJs()]).then(() => {
        if (typeof window.AOS === 'undefined') {
            throw new Error('AOS library failed to load');
        }

        window.AOS.init();
    });
};

/**
 * @param {ReturnType<typeof cache>} c
 * @returns {Promise<void>}
 */
const loadConfetti = (c) => {
    const url = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js';

    return c.get(url).then((uri) => new Promise((res, rej) => {
        const sc = document.createElement('script');
        sc.onerror = rej;
        sc.onload = () => {
            typeof window.confetti === 'undefined' ? rej(new Error('Confetti library failed to load')) : res();
        };

        sc.src = uri;
        document.head.appendChild(sc);
    }));
};

/**
 * @param {ReturnType<typeof cache>} c
 * @returns {Promise<void>}
 */
const loadAdditionalFont = (c) => {

    const fonts = [
        'https://fonts.googleapis.com/css2?family=Sacramento&display=swap',
        'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic&display=swap',
    ];

    /**
     * @param {string} font
     * @returns {Promise<void>}
     */
    const loadCss = (font) => c.get(font)
        .then(window.fetch)
        .then((r) => r.text())
        .then((txt) => {
            const urls = Array.from(new Set(txt.matchAll(/url\(["']?([^"')]+)["']?\)/g)), (v) => v[1]);

            return Promise.all(urls.map((v) => c.get(v))).then((res) => {

                for (const [i, abs] of res.entries()) {
                    txt = txt.replaceAll(urls[i], abs);
                }

                return txt;
            });
        })
        .then((txt) => new Promise((res, rej) => {
            const link = document.createElement('link');
            link.onload = res;
            link.onerror = rej;

            link.rel = 'stylesheet';
            link.href = URL.createObjectURL(new Blob([txt]));
            document.head.appendChild(link);
        }));

    return Promise.all(fonts.map(loadCss));
};

/**
 * @param {Object} [opt]
 * @param {boolean} [opt.aos=true] - Load AOS library
 * @param {boolean} [opt.confetti=true] - Load Confetti library
 * @param {boolean} [opt.additionalFont=true] - Load Additional Font
 * @returns {Promise<void>}
 */
export const loader = (opt = {}) => {
    const c = cache('libs');

    return c.open().then(() => {
        const promises = [];

        if (opt?.aos ?? true) {
            promises.push(loadAOS(c));
        }

        if (opt?.confetti ?? true) {
            promises.push(loadConfetti(c));
        }

        if (opt?.additionalFont ?? true) {
            promises.push(loadAdditionalFont(c));
        }

        return Promise.all(promises);
    });
};