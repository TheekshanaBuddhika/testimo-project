import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './WidgetPage.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface WidgetTestimonial {
  id: string;
  submitter_name: string;
  submitter_title: string | null;
  submitter_company: string | null;
  submitter_avatar: string | null;
  content: string;
  rating: number | null;
}

export default function WidgetPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams] = useSearchParams();
  const [testimonials, setTestimonials] = useState<WidgetTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration from URL params
  const config = {
    theme: searchParams.get('theme') || 'dark',
    layout: searchParams.get('layout') || 'carousel',
    primaryColor: searchParams.get('primaryColor') || '#6366f1',
    borderRadius: searchParams.get('borderRadius') || '12px',
    template: searchParams.get('template') || 'classic',
    showRating: searchParams.get('showRating') !== 'false',
    showAvatar: searchParams.get('showAvatar') !== 'false',
    maxLines: parseInt(searchParams.get('maxLines') || '4'),
  };

  useEffect(() => {
    if (!workspaceId) return;
    fetch(`${BASE_URL}/api/workspaces/${workspaceId}/widget`)
      .then(res => res.json())
      .then(data => {
        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
        } else {
          // Provide mock data for preview if workspace is empty
          setTestimonials([
            {
              id: 'mock-1',
              submitter_name: 'Jane Doe',
              submitter_title: 'CEO',
              submitter_company: 'Example Corp',
              submitter_avatar: null,
              content: 'Testimo has completely transformed how we showcase our customer feedback. The widgets are beautiful and so easy to set up!',
              rating: 5
            },
            {
              id: 'mock-2',
              submitter_name: 'John Smith',
              submitter_title: 'Marketing Manager',
              submitter_company: 'TechFlow',
              submitter_avatar: null,
              content: 'The social media sync is a game-changer. All our reviews in one place!',
              rating: 4
            }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading || testimonials.length === 0) return null;

  const renderStars = (rating: number) => (
    <div className="testimonial-rating" style={{ color: config.primaryColor }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </div>
  );

  return (
    <div 
      className={`widget-container theme-${config.theme} layout-${config.layout} template-${config.template}`}
      style={{ 
        '--primary-color': config.primaryColor, 
        '--border-radius': config.borderRadius,
        '--max-lines': config.maxLines
      } as any}
    >
      <div className="testimonial-grid">
        {testimonials.map((t) => (
          <div key={t.id} className="testimonial-card">
            <div className="card-inner">
              {config.showRating && t.rating != null && t.rating > 0 && renderStars(t.rating)}
              <p className="testimonial-content">"{t.content}"</p>
              <div className="testimonial-author">
                {config.showAvatar && (
                  <div className="author-avatar">
                    {t.submitter_avatar ? (
                      <img src={t.submitter_avatar} alt={t.submitter_name} />
                    ) : (
                      <div className="avatar-placeholder">{t.submitter_name[0]}</div>
                    )}
                  </div>
                )}
                <div className="author-info">
                  <div className="author-name">{t.submitter_name}</div>
                  {(t.submitter_title || t.submitter_company) && (
                    <div className="author-title">
                      {[t.submitter_title, t.submitter_company].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

