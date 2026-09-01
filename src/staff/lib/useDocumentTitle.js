// Sets the browser tab title per page instead of leaving every /staff/*
// route on the same static <title> — useful once people have several
// tabs/bookmarks open (Sign in, Who's in, Admin, …).
import { useEffect } from "react";

function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title + " · Wirral Ways Staff Portal";
    return () => { document.title = previous; };
  }, [title]);
}

export { useDocumentTitle };
