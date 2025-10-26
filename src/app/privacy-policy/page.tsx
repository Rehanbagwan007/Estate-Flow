
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy for EstateFlow CRM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <em>Last Updated: {new Date().toLocaleDateString()}</em>
          </p>
          <p>
            This is a placeholder privacy policy for the EstateFlow CRM application during its development phase. This document is intended to provide a valid URL for API and service integrations and is not a legally binding agreement.
          </p>

          <h2 className="text-xl font-semibold">1. Data Collection</h2>
          <p>
            For the purpose of integrating with third-party services like Meta (Facebook and Instagram), this application may request permissions to access certain data associated with your account, such as page information and content publishing rights.
          </p>

          <h2 className="text-xl font-semibold">2. Use of Data</h2>
          <p>
            Data collected is used solely for the intended functionality of the application, such as posting property listings to connected social media accounts. We do not share, sell, or otherwise distribute your data to third parties, other than as required to perform the application's functions.
          </p>
          
          <h2 className="text-xl font-semibold">3. Data Security</h2>
          <p>
            We take reasonable measures to protect the information that we handle. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.
          </p>
          
          <h2 className="text-xl font-semibold">4. Contact Information</h2>
          <p>
            For any questions regarding this placeholder policy, please refer to the development team.
          </p>
          
          <p className="font-bold text-destructive">
            Disclaimer: This is not a real privacy policy. A comprehensive and legally compliant privacy policy must be drafted by a qualified professional before this application is made available to the public.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
