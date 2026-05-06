import {
  Button,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  PersonCircle24Regular,
  SignOut24Regular,
  Heart24Regular,
  Settings24Regular,
  Box24Regular,
  PuzzlePieceRegular,
  Open16Regular,
  Document24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { AddPackageDialog } from '@/components/AddPackageDialog';

export function Header() {
  const { user, signIn, signOut, authError } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacingHorizontalM,
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXL}`,
      height: 48,
      flexShrink: 0,
    }}>
      <Link to="/" style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
      }}>
        <Box24Regular style={{ color: tokens.colorBrandForeground1, fontSize: 24 }} />
        <Text weight="bold" size={400} style={{ color: tokens.colorNeutralForeground1 }}>
          Design Canvas Plugins
        </Text>
      </Link>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <Button
          appearance="subtle"
          size="small"
          icon={<Document24Regular />}
          as={Link as any}
          {...{ to: "/docs" } as any}
        >
          Docs
        </Button>
        <Button
          appearance="subtle"
          size="small"
          icon={<PuzzlePieceRegular />}
          as="a"
          href="https://github.com/unthinkmedia/dc-example-hello"
          target="_blank"
          rel="noopener noreferrer"
        >
          Create a Plugin
          <Open16Regular style={{ marginLeft: tokens.spacingHorizontalXS }} />
        </Button>
        {user && <AddPackageDialog />}
        {user ? (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={
                  <Avatar
                    name={user.user_metadata?.['user_name'] as string ?? 'User'}
                    image={{ src: user.user_metadata?.['avatar_url'] as string }}
                    size={28}
                  />
                }
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Heart24Regular />} onClick={() => navigate('/dashboard')}>
                  My Dashboard
                </MenuItem>
                <MenuItem icon={<Settings24Regular />} onClick={() => navigate('/admin')}>
                  Admin
                </MenuItem>
                <MenuItem icon={<SignOut24Regular />} onClick={signOut}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        ) : (
          <>
            {authError && (
              <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                {authError}
              </Text>
            )}
            <Button
              appearance="subtle"
              icon={<PersonCircle24Regular />}
              onClick={signIn}
            >
              Sign in with GitHub
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
