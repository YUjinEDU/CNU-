import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/DirectionsCar/g, 'Car')
                 .replace(/Group/g, 'Users')
                 .replace(/Person/g, 'UserIcon')
                 .replace(/Verified/g, 'BadgeCheck')
                 .replace(/EventNote/g, 'Calendar')
                 .replace(/RocketLaunch/g, 'Rocket')
                 .replace(/Hail/g, 'Hand')
                 .replace(/LocationOn/g, 'MapPin')
                 .replace(/ExpandMore/g, 'ChevronDown')
                 .replace(/Schedule/g, 'Clock')
                 .replace(/Remove/g, 'Minus')
                 .replace(/Add/g, 'Plus')
                 .replace(/ArrowForward/g, 'ArrowRight')
                 .replace(/ThumbUp/g, 'ThumbsUp')
                 .replace(/ThumbDown/g, 'ThumbsDown')
                 .replace(/Eco/g, 'Leaf')
                 .replace(/Biotech/g, 'Microscope')
                 .replace(/Apartment/g, 'Building2')
                 .replace(/MedicalServices/g, 'Stethoscope')
                 .replace(/Agriculture/g, 'Tractor')
                 .replace(/Science/g, 'FlaskConical')
                 .replace(/Architecture/g, 'Building')
                 .replace(/ChatBubble/g, 'MessageCircle')
                 .replace(/VerifiedUser/g, 'UserCheck')
                 .replace(/NearMe/g, 'Navigation')
                 .replace(/EmergencyShare/g, 'AlertTriangle')
                 .replace(/Call/g, 'Phone')
                 .replace(/Cancel/g, 'X');

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced icons in App.tsx');
