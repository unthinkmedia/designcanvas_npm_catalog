import {
  Toolbar,
  ToolbarButton,
  Input,
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
  Search24Regular,
  PersonCircle24Regular,
  SignOut24Regular,
  Heart24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function Header({ search, onSearchChange }: HeaderProps) {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacingHorizontalM,
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      background: tokens.colorNeutralBackground1,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        <Text weight="bold" size={500} style={{ color: tokens.colorBrandForeground1 }}>
          NPM Catalog
        </Text>
      </Link>

      <div style={{ flex: 1, maxWidth: 480 }}>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search packages..."
          value={search}
          onChange={(_e, data) => onSearchChange(data.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
        {user ? (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <ToolbarButton
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
          <Toolbar>
            <ToolbarButton icon={<PersonCircle24Regular />} onClick={signIn}>
              Sign in with GitHub
            </ToolbarButton>
          </Toolbar>
        )}
      </div>
    </header>
  );
}
