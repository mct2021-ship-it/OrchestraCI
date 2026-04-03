export interface AvatarData {
  url: string;
  gender: 'Male' | 'Female' | 'Non-binary';
  ageBracket: '18-30' | '31-50' | '51+';
}

export const AVATAR_LIBRARY: AvatarData[] = [
  // 18-30 Female
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '18-30' },
  // 18-30 Male
  { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '18-30' },
  // 31-50 Female
  { url: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '31-50' },
  // 31-50 Male
  { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '31-50' },
  // 51+ Female
  { url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1581579186913-46ac3a6efea3?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1553514029-1318c9127859?w=400&h=400&fit=crop', gender: 'Female', ageBracket: '51+' },
  // 51+ Male
  { url: 'https://images.unsplash.com/photo-1533227260879-1090f1168eb2?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '51+' },
  { url: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=400&fit=crop', gender: 'Male', ageBracket: '51+' },
  // Non-binary / Androgynous
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', gender: 'Non-binary', ageBracket: '18-30' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', gender: 'Non-binary', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop', gender: 'Non-binary', ageBracket: '31-50' },
  { url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop', gender: 'Non-binary', ageBracket: '51+' },
];
