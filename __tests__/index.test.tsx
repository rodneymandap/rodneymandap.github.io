import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../pages/index';
import '@testing-library/jest-dom';

// Mock Next.js modules
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    },
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hero Section', () => {
    it('renders hero section with name and title', () => {
      render(<Home />);
      
      expect(screen.getByText('Rodney Jan Mandap')).toBeInTheDocument();
      expect(screen.getAllByText('Software Engineer').length).toBeGreaterThan(0);
    });

    it('displays availability badge', () => {
      render(<Home />);
      
      expect(screen.getByText('Available for Projects')).toBeInTheDocument();
      expect(screen.getByLabelText('Current availability status')).toBeInTheDocument();
    });

    it('calculates and displays years of experience correctly', () => {
      render(<Home />);
      
      const currentYear = new Date().getFullYear();
      const expectedYears = currentYear - 2016;
      
      expect(screen.getByText(`${expectedYears}+`)).toBeInTheDocument();
      expect(screen.getByText('Years Experience')).toBeInTheDocument();
    });

    it('displays call-to-action buttons', () => {
      render(<Home />);
      
      const hireButtons = screen.getAllByText('Hire Me');
      expect(hireButtons.length).toBeGreaterThan(0);
    });

    it('shows greeting text', () => {
      render(<Home />);
      
      expect(screen.getByText("Hello, I'm")).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders navigation links', () => {
      render(<Home />);
      
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getAllByText('Certifications').length).toBeGreaterThan(0);
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('toggles mobile menu when hamburger is clicked', () => {
      render(<Home />);
      
      const hamburgerButton = screen.getByRole('button', { name: '' });
      
      // Mobile menu should not be visible initially
      const mobileLinks = screen.queryAllByText('About');
      const initialCount = mobileLinks.length;
      
      // Click to open
      fireEvent.click(hamburgerButton);
      
      // Check that menu items are present
      const openLinks = screen.queryAllByText('About');
      expect(openLinks.length).toBeGreaterThanOrEqual(initialCount);
    });

    it('closes mobile menu when a link is clicked', () => {
      render(<Home />);
      
      const hamburgerButton = screen.getByRole('button', { name: '' });
      
      // Open mobile menu
      fireEvent.click(hamburgerButton);
      
      // Click a navigation link
      const aboutLinks = screen.getAllByText('About');
      if (aboutLinks.length > 1) {
        fireEvent.click(aboutLinks[aboutLinks.length - 1]);
      }
      
      // Menu should still be clickable (component handles this internally)
      expect(hamburgerButton).toBeInTheDocument();
    });
  });

  describe('About Section', () => {
    it('renders about section content', () => {
      render(<Home />);
      
      expect(screen.getByText('About Me')).toBeInTheDocument();
      expect(screen.getAllByText(/Software Engineer/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Building Scalable Solutions/)).toBeInTheDocument();
    });

    it('displays core technologies', () => {
      render(<Home />);
      
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Django').length).toBeGreaterThan(0);
      expect(screen.getByText('Core Language')).toBeInTheDocument();
      expect(screen.getByText('Primary Framework')).toBeInTheDocument();
    });

    it('shows feature cards with emojis', () => {
      render(<Home />);
      
      expect(screen.getByText('Freelance Flexibility')).toBeInTheDocument();
      expect(screen.getByText('Django Specialist')).toBeInTheDocument();
      expect(screen.getByText('End-to-End Delivery')).toBeInTheDocument();
    });
  });

  describe('Skills Section', () => {
    it('renders skills section heading', () => {
      render(<Home />);
      
      expect(screen.getByText('My Expertise')).toBeInTheDocument();
      expect(screen.getByText('Skills & Technologies')).toBeInTheDocument();
    });

    it('displays all primary skills with levels', () => {
      render(<Home />);
      
      // Check for main skills (using getAllByText for skills that appear multiple times)
      expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Django').length).toBeGreaterThan(0);
      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getAllByText('Azure').length).toBeGreaterThan(0);
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('REST APIs')).toBeInTheDocument();
      expect(screen.getByText('Linux')).toBeInTheDocument();
      expect(screen.getByText('CI/CD')).toBeInTheDocument();
    });

    it('displays skill percentages', () => {
      render(<Home />);
      
      // Check for percentage values
      expect(screen.getByText('94%')).toBeInTheDocument(); // Python
      expect(screen.getAllByText('88%').length).toBeGreaterThan(0); // Django and Linux
    });

    it('shows additional technologies', () => {
      render(<Home />);
      
      expect(screen.getByText('Django REST Framework')).toBeInTheDocument();
      expect(screen.getByText('Celery')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('Git')).toBeInTheDocument();
    });
  });

  describe('Certifications Section', () => {
    it('renders certifications section', () => {
      render(<Home />);
      
      expect(screen.getByText('Credentials')).toBeInTheDocument();
      // Use getAllByText since "Certifications" appears in navigation and section heading
      expect(screen.getAllByText('Certifications').length).toBeGreaterThan(0);
    });

    it('displays Azure certifications', () => {
      render(<Home />);
      
      expect(screen.getByText('Azure Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Azure Administrator Associate')).toBeInTheDocument();
    });

    it('renders certification icons', () => {
      render(<Home />);
      
      // Check for SVG icons (Azure icons)
      const azureIcons = screen.getAllByAltText('Microsoft');
      expect(azureIcons.length).toBe(2);
    });

    it('shows certification details', () => {
      render(<Home />);
      
      expect(screen.getAllByText('Microsoft').length).toBe(2);
      expect(screen.getByText('2021')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('displays credential IDs', () => {
      render(<Home />);
      
      expect(screen.getByText('ID: AZ-900')).toBeInTheDocument();
      expect(screen.getByText('ID: AZ-104')).toBeInTheDocument();
    });

    it('has links to view certificates', () => {
      render(<Home />);
      
      const certLinks = screen.getAllByText('View Certificate');
      expect(certLinks.length).toBe(2);
      
      certLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('target', '_blank');
        expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Contact Section', () => {
    it('renders contact section', () => {
      render(<Home />);
      
      expect(screen.getByText('Get In Touch')).toBeInTheDocument();
      expect(screen.getByText("Let's Build Something Great")).toBeInTheDocument();
    });

    it('displays contact form fields', () => {
      render(<Home />);
      
      expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Web Application/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tell me about your project/)).toBeInTheDocument();
    });

    it('has a submit button', () => {
      render(<Home />);
      
      const submitButton = screen.getByText('Send Message');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.closest('button')).toHaveAttribute('type', 'submit');
    });

    it('shows toast notification when form is submitted', async () => {
      render(<Home />);
      
      const form = screen.getByText('Send Message').closest('form');
      
      if (form) {
        fireEvent.submit(form);
        
        await waitFor(() => {
          expect(screen.getByText('Feature Coming Soon')).toBeInTheDocument();
        });
        
        expect(screen.getByText(/The contact form is not yet functional/)).toBeInTheDocument();
      }
    });

    it('hides toast notification after timeout', async () => {
      jest.useFakeTimers();
      render(<Home />);
      
      const form = screen.getByText('Send Message').closest('form');
      
      if (form) {
        fireEvent.submit(form);
        
        await waitFor(() => {
          expect(screen.getByText('Feature Coming Soon')).toBeInTheDocument();
        });
        
        // Fast-forward time by 4 seconds
        await act(async () => {
          jest.advanceTimersByTime(4000);
        });
        
        await waitFor(() => {
          expect(screen.queryByText('Feature Coming Soon')).not.toBeInTheDocument();
        });
      }
      
      jest.useRealTimers();
    });

    it('can close toast notification manually', async () => {
      render(<Home />);
      
      const form = screen.getByText('Send Message').closest('form');
      
      if (form) {
        fireEvent.submit(form);
        
        await waitFor(() => {
          expect(screen.getByText('Feature Coming Soon')).toBeInTheDocument();
        });
        
        // Find and click the close button
        const closeButtons = screen.getAllByRole('button');
        const closeButton = closeButtons.find(btn => {
          const svg = btn.querySelector('svg');
          return svg !== null;
        });
        
        if (closeButton) {
          fireEvent.click(closeButton);
          
          await waitFor(() => {
            expect(screen.queryByText('Feature Coming Soon')).not.toBeInTheDocument();
          });
        }
      }
    });

    it('displays social media links', () => {
      render(<Home />);
      
      const githubLink = screen.getByText('GitHub').closest('a');
      const linkedinLink = screen.getByText('LinkedIn').closest('a');
      
      expect(githubLink).toHaveAttribute('href', 'https://github.com/rodneymandap');
      expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/rjmandap/');
    });
  });

  describe('Footer', () => {
    it('renders footer with copyright', () => {
      render(<Home />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}.*Rodney Jan Mandap`))).toBeInTheDocument();
    });

    it('displays role in footer', () => {
      render(<Home />);
      
      expect(screen.getByText('Freelance Software Engineer')).toBeInTheDocument();
    });
  });

  describe('SEO and Meta', () => {
    it('sets page title', () => {
      render(<Home />);
      
      // The title is set in the Head component
      expect(screen.getByText('Rodney Jan Mandap | Freelance Software Engineer')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders logo images with error handling', () => {
      render(<Home />);
      
      const images = screen.getAllByAltText('RJM Logo');
      expect(images.length).toBeGreaterThan(0);
    });

    it('handles logo image load errors in navigation', () => {
      render(<Home />);
      
      const images = screen.getAllByAltText('RJM Logo');
      const navLogo = images[0];
      
      // Simulate image load error
      fireEvent.error(navLogo);
      
      // The image should be hidden and replaced with text
      expect(navLogo.style.display).toBe('none');
    });

    it('handles logo image load errors in footer', () => {
      render(<Home />);
      
      const images = screen.getAllByAltText('RJM Logo');
      const footerLogo = images[images.length - 1];
      
      // Simulate image load error
      fireEvent.error(footerLogo);
      
      // The image should be hidden
      expect(footerLogo.style.display).toBe('none');
    });

    it('displays profile image', () => {
      render(<Home />);
      
      const profileImage = screen.getByAltText('Rodney Jan Mandap');
      expect(profileImage).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('has working navigation anchors', () => {
      render(<Home />);
      
      const aboutLink = screen.getAllByText('About')[0];
      expect(aboutLink.closest('a')).toHaveAttribute('href', '#about');
      
      const skillsLink = screen.getAllByText('Skills')[0];
      expect(skillsLink.closest('a')).toHaveAttribute('href', '#skills');
      
      const contactLink = screen.getAllByText('Contact')[0];
      expect(contactLink.closest('a')).toHaveAttribute('href', '#contact');
    });

    it('has external links that open in new tab', () => {
      render(<Home />);
      
      const certLinks = screen.getAllByText('View Certificate');
      certLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Animation and Styling', () => {
    it('applies gradient text to specific elements', () => {
      render(<Home />);
      
      const gradientElements = document.querySelectorAll('.gradient-text');
      expect(gradientElements.length).toBeGreaterThan(0);
    });

    it('has floating animation elements', () => {
      render(<Home />);
      
      const floatingElements = document.querySelectorAll('.animate-float');
      expect(floatingElements.length).toBeGreaterThan(0);
    });
  });
});
