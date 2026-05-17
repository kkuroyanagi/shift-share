import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('components/ui/Card', () => {
  it('should render Card component', () => {
    render(<Card data-testid="card">Card content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card');
  });

  it('should render CardHeader component', () => {
    render(<CardHeader data-testid="card-header">Header content</CardHeader>);
    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
  });

  it('should render CardTitle component', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>);
    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-2xl', 'font-semibold');
  });

  it('should render CardDescription component', () => {
    render(<CardDescription data-testid="card-description">Description</CardDescription>);
    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should render CardContent component', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>);
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('should render CardFooter component', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>);
    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the card content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('This is a test card description')).toBeInTheDocument();
    expect(screen.getByText('This is the card content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should apply custom className to all components', () => {
    render(
      <Card className="custom-card">
        <CardHeader className="custom-header">Header</CardHeader>
        <CardTitle className="custom-title">Title</CardTitle>
        <CardDescription className="custom-description">Description</CardDescription>
        <CardContent className="custom-content">Content</CardContent>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Header').closest('div')).toHaveClass('custom-card');
    expect(screen.getByText('Header')).toHaveClass('custom-header');
    expect(screen.getByText('Title')).toHaveClass('custom-title');
    expect(screen.getByText('Description')).toHaveClass('custom-description');
    expect(screen.getByText('Content')).toHaveClass('custom-content');
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });
});