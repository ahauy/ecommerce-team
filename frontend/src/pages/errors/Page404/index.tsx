import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BaseUrl from '@/consts/baseUrl';

const Page404: React.FC = () => {
  return (
    <div className="flex h-[100vh] w-[100vw] items-center justify-center bg-[#fbfbf5]">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-light leading-tight text-zinc-900">404</h1>
        <span className="font-medium text-zinc-900">Oops! Page Not Found!</span>
        <p className="text-center text-zinc-500">
          It seems like the page you're looking for <br />
          does not exist or might have been removed.
        </p>
        <div className="mt-6 flex gap-4">
          <Button asChild className="rounded-full bg-black text-white hover:bg-zinc-800 h-11 px-8">
            <Link to={BaseUrl.Homepage}>Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Page404);
