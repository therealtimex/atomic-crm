export const isDemoMode = () => {
    return import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_IS_DEMO === "true";
};
