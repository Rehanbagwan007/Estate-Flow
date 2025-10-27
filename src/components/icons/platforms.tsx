import type { SVGProps } from 'react';

export function OlxLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm-8.4 52.88a8 8 0 0 1 11.2 2.41l32 48a8 8 0 0 1 0 9.42l-32 48a8 8 0 0 1-13.6-6.83l17.75-26.63-44.22-66.32a8 8 0 0 1 11.2-2.41l32 48a8 8 0 0 1 0 9.42l-2.12 3.17-19.79-29.68a8 8 0 1 1 13.6-9.06l19.79 29.68 2.12-3.17a8 8 0 0 1 13.6 9.06L144.14 149l19.79-29.68a8 8 0 1 1 13.6 9.06l-24.89 37.33a8 8 0 0 1-11.2-2.41l-32-48a8 8 0 0 1 0-9.42l32-48a8 8 0 0 1 13.6 6.83L135.25 119l44.22 66.32a8 8 0 0 1-11.2 2.41l-32-48a8 8 0 0 1 0-9.42l2.12-3.17 19.79 29.68a8 8 0 1 1-13.6 9.06L124.76 149l-2.12 3.17a8 8 0 0 1-13.6-9.06l24.89-37.33a8 8 0 0 1 11.2 2.41l32 48a8 8 0 0 1 0 9.42Z" />
    </svg>
  );
}

export function NinetyNineAcresLogo(props: SVGProps<SVGSVGElement>) {
  return (
     <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}
