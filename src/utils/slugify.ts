
export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\u0000-\u007F\u0980-\u09FF\w-]+/g, '') // Keep alphanumeric, Bengali, and existing dashes/underscores
        .replace(/--+/g, '-');    // Replace multiple - with single -
};
