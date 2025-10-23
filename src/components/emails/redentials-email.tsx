import * as React from 'react';
import { Html } from '@react-email/html';
import { Button } from '@react-email/button';

interface CredentialsEmailProps {
  firstName: string;
  email: string;
  password?: string;
}

export const CredentialsEmail: React.FC<Readonly<CredentialsEmailProps>> = ({
  firstName,
  email,
  password,
}) => (
  <Html lang="en">
    <h1>Welcome to EstateFlow CRM, {firstName}!</h1>
    <p>
      A new account has been created for you by an administrator.
    </p>
    <p>
      You can now log in using the following credentials:
    </p>
    <ul>
      <li><strong>Email:</strong> {email}</li>
      <li><strong>Password:</strong> {password}</li>
    </ul>
    <p>
      We recommend that you do not share the password
    </p>
    <Button
      pX={20}
      pY={12}
      href={process.env.NEXTAUTH_URL || 'http://localhost:3000/login'}
      style={{ background: '#000', color: '#fff' }}
    >
      Login to Your Account
    </Button>
  </Html>
);

export default CredentialsEmail;