// Common animation variants for Framer Motion

export const fadeIn = (direction: "up" | "down" | "left" | "right" = "up", delay = 0) => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
  },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.4,
      delay,
      ease: "easeOut",
    },
  },
});

export const slideIn = (direction: "left" | "right", delay = 0) => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -30 : 30,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay,
      ease: "easeOut",
    },
  },
});

export const scaleIn = (delay = 0) => ({
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay,
      ease: "easeOut",
    },
  },
});

// Common hover and tap animations
export const buttonHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const iconHover = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.95 },
};

// Common modal animations
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
}; 