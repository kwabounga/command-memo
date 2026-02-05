// src/lib/icons.ts
export const icons = Object.keys(
    import.meta.glob("/static/assets/svg/*.svg", { eager: true })
).map(path =>
    path
        .split("/")
        .pop()!
        .replace(".svg", "")
);
