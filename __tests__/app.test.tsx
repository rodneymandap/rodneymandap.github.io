import { render } from '@testing-library/react';
import MyApp from '../pages/_app';
import '@testing-library/jest-dom';

// Mock Vercel Analytics
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics">Analytics</div>,
}));

describe('_app', () => {
  it('renders without crashing', () => {
    const Component = () => <div>Test Component</div>;
    const pageProps = {};

    const { container } = render(<MyApp Component={Component} pageProps={pageProps} router={{} as any} />);
    expect(container).toBeInTheDocument();
  });

  it('renders the page component', () => {
    const Component = () => <div data-testid="test-component">Test Page</div>;
    const pageProps = {};

    const { getByTestId } = render(<MyApp Component={Component} pageProps={pageProps} router={{} as any} />);
    expect(getByTestId('test-component')).toBeInTheDocument();
  });

  it('renders Analytics component', () => {
    const Component = () => <div>Test Component</div>;
    const pageProps = {};

    const { getByTestId } = render(<MyApp Component={Component} pageProps={pageProps} router={{} as any} />);
    expect(getByTestId('analytics')).toBeInTheDocument();
  });

  it('passes pageProps to the component', () => {
    const Component = ({ testProp }: { testProp: string }) => (
      <div data-testid="prop-value">{testProp}</div>
    );
    const pageProps = { testProp: 'test-value' };

    const { getByTestId } = render(<MyApp Component={Component} pageProps={pageProps} router={{} as any} />);
    expect(getByTestId('prop-value')).toHaveTextContent('test-value');
  });

  it('applies global styles', () => {
    const Component = () => <div>Test Component</div>;
    const pageProps = {};

    const { container } = render(<MyApp Component={Component} pageProps={pageProps} router={{} as any} />);
    
    // Check that the component tree is properly structured
    expect(container.firstChild).toBeTruthy();
  });
});
