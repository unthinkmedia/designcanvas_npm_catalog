import { useState } from 'react';
import { Text, Button, Input, tokens } from '@fluentui/react-components';
import {
  PersonCircle24Regular,
  MailRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';
import { MeshBackground, WireframeMesh } from '@/components/AnimatedBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function GatePage({ authError: externalError }: { authError?: string | null }) {
  const { signIn, authError: hookError } = useAuth();
  const authError = externalError || hookError;
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmitEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    const { error } = await supabase.from('waitlist').insert({ email: trimmed });
    setSubmitting(false);
    if (error?.code === '23505') {
      setSubmitted(true);
      return;
    }
    if (error) {
      setEmailError('Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div data-hero style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      overflow: 'hidden',
      background: tokens.colorNeutralBackground3,
    }}>
      <MeshBackground />
      <WireframeMesh />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 520,
        padding: `0 ${tokens.spacingHorizontalXL}`,
        gap: tokens.spacingVerticalL,
      }}>
        <Text size={900} weight="bold" as="h1" style={{
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
        }}>
          Design Canvas Catalog
        </Text>

        {authError ? (
          <>
            <Text size={400} style={{
              color: tokens.colorNeutralForeground3,
              lineHeight: 1.5,
            }}>
              It looks like your GitHub account isn't part of a Microsoft EMU organization.
              This catalog is currently limited to Microsoft employees, but we're working on
              opening it up.
            </Text>

            {submitted ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacingHorizontalS,
                padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
                borderRadius: tokens.borderRadiusMedium,
                background: 'rgba(99, 102, 241, 0.1)',
                border: `1px solid rgba(99, 102, 241, 0.25)`,
              }}>
                <CheckmarkCircleRegular style={{ color: tokens.colorBrandForeground1, fontSize: 20 }} />
                <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                  You're on the list! We'll let you know when access opens up.
                </Text>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: tokens.spacingVerticalS,
                width: '100%',
                maxWidth: 360,
              }}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  Leave your email and we'll notify you when it's available:
                </Text>
                <div style={{
                  display: 'flex',
                  gap: tokens.spacingHorizontalS,
                  width: '100%',
                }}>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(_e, data) => setEmail(data.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitEmail(); }}
                    contentBefore={<MailRegular />}
                    style={{ flex: 1 }}
                  />
                  <Button
                    appearance="primary"
                    onClick={handleSubmitEmail}
                    disabled={submitting}
                  >
                    {submitting ? 'Sending…' : 'Notify me'}
                  </Button>
                </div>
                {emailError && (
                  <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                    {emailError}
                  </Text>
                )}
              </div>
            )}

            <Button
              appearance="subtle"
              size="medium"
              icon={<PersonCircle24Regular />}
              onClick={signIn}
              style={{ marginTop: tokens.spacingVerticalS }}
            >
              Try a different account
            </Button>
          </>
        ) : (
          <>
            <Text size={400} style={{
              color: tokens.colorNeutralForeground3,
              lineHeight: 1.5,
            }}>
              This application is currently available to Microsoft employees only.
              <br />
              Please check back soon for public access.
            </Text>

            <Button
              appearance="primary"
              size="large"
              icon={<PersonCircle24Regular />}
              onClick={signIn}
              style={{ marginTop: tokens.spacingVerticalM }}
            >
              Sign in with GitHub
            </Button>

            <Text size={200} style={{ color: tokens.colorNeutralForeground4, marginTop: tokens.spacingVerticalS }}>
              Requires a Microsoft EMU GitHub account
            </Text>
          </>
        )}
      </div>
    </div>
  );
}
