import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  className?: string;
  theme?: "default" | "amber" | "blue" | "green";
}

export function AnimatedToggle({
  checked,
  onChange,
  size = "md",
  label,
  icon,
  activeIcon,
  className,
  theme = "default"
}: AnimatedToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange(newValue);
  };

  // Size mapping
  const sizeMap = {
    sm: {
      toggle: "w-8 h-4",
      circle: "w-3 h-3",
      translate: "translate-x-4",
      text: "text-xs"
    },
    md: {
      toggle: "w-11 h-6",
      circle: "w-5 h-5",
      translate: "translate-x-5",
      text: "text-sm"
    },
    lg: {
      toggle: "w-14 h-7",
      circle: "w-6 h-6",
      translate: "translate-x-7",
      text: "text-base"
    }
  };

  // Theme mapping
  const themeMap = {
    default: {
      active: "bg-primary",
      inactive: "bg-gray-200 dark:bg-gray-700",
      circle: "bg-white"
    },
    amber: {
      active: "bg-amber",
      inactive: "bg-amber/20",
      circle: "bg-white"
    },
    blue: {
      active: "bg-blue-500",
      inactive: "bg-blue-200 dark:bg-blue-900/30",
      circle: "bg-white"
    },
    green: {
      active: "bg-green-500",
      inactive: "bg-green-200 dark:bg-green-900/30",
      circle: "bg-white"
    }
  };

  const currentSize = sizeMap[size];
  const currentTheme = themeMap[theme];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className={cn("font-medium text-foreground", currentSize.text)}>
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          currentSize.toggle,
          isChecked ? currentTheme.active : currentTheme.inactive
        )}
        role="switch"
        aria-checked={isChecked}
      >
        <motion.span
          className={cn(
            "inline-block rounded-full pointer-events-none",
            currentSize.circle,
            currentTheme.circle
          )}
          initial={false}
          animate={{
            x: isChecked ? "100%" : "0%",
            translateX: isChecked ? "-100%" : "0%"
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20
          }}
        >
          {isChecked ? activeIcon : icon}
        </motion.span>
        
        {/* Flash of light animation when toggled */}
        {isChecked && (
          <motion.span
            className="absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </button>
    </div>
  );
}