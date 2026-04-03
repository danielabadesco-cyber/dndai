import type { Campaign } from '../types';

const CAMPAIGNS_KEY = 'dndai_campaigns';

export function getAllCampaigns(): Campaign[] {
  const data = localStorage.getItem(CAMPAIGNS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getCampaign(id: string): Campaign | undefined {
  return getAllCampaigns().find(c => c.id === id);
}

export function saveCampaign(campaign: Campaign): void {
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  campaign.updatedAt = new Date().toISOString();
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

export function deleteCampaign(id: string): void {
  const campaigns = getAllCampaigns().filter(c => c.id !== id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}
