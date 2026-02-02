"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  tooltip?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const variantStyles = {
  default: {
    bg: "bg-gray-100",
    icon: "text-gray-600",
  },
  success: {
    bg: "bg-green-100",
    icon: "text-green-600",
  },
  warning: {
    bg: "bg-orange-100",
    icon: "text-orange-600",
  },
  danger: {
    bg: "bg-red-100",
    icon: "text-red-600",
  },
  info: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  tooltip,
  variant = "default",
  size = "md",
  onClick,
}: MetricCardProps) {
  const styles = variantStyles[variant];
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${sizeClasses[size]} ${
        onClick ? "cursor-pointer hover:border-gray-300 transition-colors" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
            {tooltip && (
              <div className="group relative">
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 w-48 p-2 text-xs bg-gray-900 text-white rounded-lg shadow-lg">
                  {tooltip}
                </div>
              </div>
            )}
          </div>
          <p
            className={`font-bold text-gray-900 mt-1 ${
              size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span
                className={`text-xs font-medium ${
                  trend.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-400 ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`h-9 w-9 ${styles.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <div className={styles.icon}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
