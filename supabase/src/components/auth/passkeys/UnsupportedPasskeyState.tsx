
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function UnsupportedPasskeyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Keys</CardTitle>
        <CardDescription>
          Your browser doesn't support WebAuthn security keys or passkeys
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
