import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  label: string;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', label, className = '', ...props }) => {
  const baseStyles = "relative px-6 py-3 font-bold uppercase tracking-widest text-sm transition-all duration-100 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed clip-path-polygon";
  
  const variants = {
    primary: "bg-[#00ffff] text-black hover:bg-white hover:text-[#ff00ff] border-2 border-transparent hover:border-[#ff00ff] shadow-[4px_4px_0px_#ff00ff]",
    secondary: "bg-black text-white border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[4px_4px_0px_#00ffff]",
    danger: "bg-[#ff0099] text-white border-2 border-transparent hover:bg-black hover:text-[#ff0099] hover:border-[#ff0099] shadow-[4px_4px_0px_white]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 mix-blend-overlay transition-opacity"></div>
    </button>
  );
};
