import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="page empty-state-page">
      <h1>404</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}

export default NotFound;
