// Generated: 2026-01-26 18:35:00 KST

'use client';

import * as React from 'react';

export const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;
export const FormField = ({ render, ...props }: any) => render(props);
export const FormItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormLabel = ({ children, ...props }: any) => <label {...props}>{children}</label>;
export const FormControl = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormMessage = ({ children, ...props }: any) => children ? <span {...props}>{children}</span> : null;

export const useForm = (config?: any) => {
  const [values, setValues] = React.useState({});
  const [errors, setErrors] = React.useState({});

  return {
    register: (name: string) => ({
      onChange: (e: any) => setValues((v) => ({ ...v, [name]: e.target.value })),
      onBlur: () => {},
    }),
    handleSubmit: (cb: any) => (e: any) => {
      e.preventDefault();
      cb(values);
    },
    formState: { errors },
    watch: (field: string) => values[field as keyof typeof values],
  };
};
