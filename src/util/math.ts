export const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);

export const abgrToRgba = (c: number): number => {
    return (
        ((c & 0xff) << 24) |
        ((c & 0xff00) << 8) |
        ((c & 0xff0000) >> 8) |
        ((c & 0xff000000) >> 24)
    );
};
