import React from 'react';
import styled from 'styled-components';

const ListSkeleton = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="card__image-group">
          <div className="card__skeleton card__image" />
          <div className="card__skeleton card__image" />
          <div className="card__skeleton card__image" />
        </div>
        <div className="card__content">
          <div className="card__skeleton card__title" />
          <div className="card__skeleton card__user-info" />
          <div className="card__skeleton card__date" />
          <div className="card__skeleton card__buttons" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    width: 100%;
    max-width: 24rem;
    background-color: #2d2d2d;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.05);
    }
  }

  .card__image-group {
    display: flex;
    gap: 4px;
    padding: 0.5rem;
  }

  .card__image {
    flex: 1;
    height: 6rem;
    border-radius: 0.5rem;
  }

  .card__content {
    padding: 0.5rem 1rem 1rem 1rem;
  }

  .card__skeleton {
    background-image: linear-gradient(
      90deg,
      #444 0px,
      #555 40px,
      #444 80px
    );
    background-size: 300%;
    background-position: 100% 0;
    border-radius: 0.25rem;
    animation: shimmer 1.5s infinite;
  }

  .card__title {
    height: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .card__user-info {
    width: 60%;
    height: 1rem;
    margin-bottom: 0.5rem;
  }

  .card__date {
    width: 40%;
    height: 0.8rem;
    margin-bottom: 1rem;
  }

  .card__buttons {
    display: flex;
    gap: 1rem;
    height: 1.2rem;
  }

  @keyframes shimmer {
    to {
      background-position: -100% 0;
    }
  }
`;

export default ListSkeleton;
