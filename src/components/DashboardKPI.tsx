import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardKPIProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200'
  },
  green: {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    light: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200'
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    light: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200'
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
    light: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-200'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    light: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200'
  }
};

const DashboardKPI: React.FC<DashboardKPIProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  loading = false,
  onClick
}) => {
  const colors = colorClasses[color];

  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.light} 
        transition-all duration-300 hover:shadow-lg hover:scale-105 group
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className={`w-full h-full ${colors.bg} rounded-full transform translate-x-16 -translate-y-16`}></div>
      </div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                {subtitle && <div className="h-4 bg-gray-200 rounded w-16"></div>}
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </>
            )}
            
            {trend && !loading && (
              <div className="mt-3 flex items-center">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500 ml-2">{trend.label}</span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-xl ${colors.bg} shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
      </div>
      
      {/* Barra de progreso si es aplicable */}
      {typeof value === 'number' && trend && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={`h-full ${colors.bg} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, trend.value))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default DashboardKPI;
