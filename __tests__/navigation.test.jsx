import { render, screen } from '@testing-library/react';
import Navigation from '../components/navigation';
import '@testing-library/jest-dom';

describe('Navigation', () => {
    it('renders a navigation links', () => {
        render(<Navigation />)

        expect(screen.getByText("About"));
        expect(screen.getByText("Certification"));
        expect(screen.getByText("Skill"));
    })
})