import { render, screen } from '@testing-library/react';
import Navigation from '../components/navigation';
import '@testing-library/jest-dom';

describe('Navigation', () => {

    it('renders a navigation links', () => {
        render(<Navigation />)

        expect(screen.getByText("Certifications"));
        expect(screen.getByText("Skills"));
    });

    it('renders my logo', () => {
        render(<Navigation />)
        expect(screen.getByRole("logo")).toBeInTheDocument();
    })

    
})