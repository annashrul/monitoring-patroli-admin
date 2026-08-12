import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api, { getErrorMessage } from "./api";

const SiteContext = createContext();

export function SiteProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/sites");
      const activeSites = (res.data.data || []).filter((s) => s.is_active);
      setSites(activeSites);
      if (activeSites.length > 0) {
        setSelectedSiteId((prev) => {
          const exists = activeSites.find((s) => s.id === prev);
          return exists ? prev : activeSites[0].id;
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat daftar site."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Sync selectedSiteId to URL query param
  const setSelectedSiteIdWithUrl = useCallback((value) => {
    setSelectedSiteId(value);
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('site_id', value);
    } else {
      url.searchParams.delete('site_id');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Read initial site_id from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('site_id');
    if (urlSiteId && sites.some((s) => s.id === urlSiteId)) {
      setSelectedSiteId(urlSiteId);
    }
  }, [sites]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null;

  return (
    <SiteContext.Provider
      value={{
        sites,
        selectedSiteId,
        setSelectedSiteId: setSelectedSiteIdWithUrl,
        selectedSite,
        loading,
        error,
        refetchSites: fetchSites,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
