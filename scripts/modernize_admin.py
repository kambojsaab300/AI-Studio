import re

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Lucide imports if not already imported
old_import = "import { Shield, LogIn, LogOut, Send, Trash2, Pause, Play, RefreshCw, AlertCircle, Upload, Users, List, Eye } from 'lucide-react';"
new_import = """import { 
    Shield, LogIn, LogOut, Send, Trash2, Pause, Play, RefreshCw, AlertCircle, Upload, 
    Users, List, Eye, Sparkles, Search, CheckCircle2, Sliders, Image, Grid, ArrowUpRight,
    Camera, Palette, ShoppingBag, EyeOff, Check, X, ChevronRight, Activity, Terminal, 
    Download, ExternalLink, HelpCircle, Layers, SlidersHorizontal, Sun, Moon, Info
} from 'lucide-react';"""

if old_import in content:
    content = content.replace(old_import, new_import)

# 2. Add TOOL_CATEGORIES and getToolCategory right before CatalogRow
categories_code = """
// ── Visual Categories for Modern SaaS Tool Browser ──
const TOOL_CATEGORIES = [
    { id: 'all', label: 'All Tools', icon: '✨' },
    { id: 'fashion', label: 'Fashion & Suits', icon: '👗' },
    { id: 'catalog', label: 'Catalog & Studio', icon: '🛍️' },
    { id: 'tryon', label: 'Try-On & Jewelry', icon: '💎' },
    { id: 'portrait', label: 'Portraits & Wedding', icon: '📸' },
    { id: 'utility', label: 'Retouch & Utility', icon: '🪄' },
    { id: 'arch', label: 'Spaces & Interior', icon: '🏠' },
    { id: 'vision', label: 'AI Vision & Chat', icon: '👁️' }
];

function getToolCategory(taskType) {
    if (['suit_studio', 'saree_lehenga_studio', 'ghost_mannequin', 'outfit_change', 'outfit_change_ref', 'man_shirt', 'man_suit', 'man_jeans', 'man_shorts', 'man_shoes', 'shirt_change', 'suit_change', 'woman_shoes'].includes(taskType)) return 'fashion';
    if (['combo_5pose_studio', 'luxury_product_podium', 'food_photography_studio', 'festival_sale_banner', 'product_angles', 'product_catalog', 'product_scene', 'mockup', 'sticker_logo', 'poster_text'].includes(taskType)) return 'catalog';
    if (['jewellery_tryon', 'watch_sunglasses_tryon', 'virtual_tryon', 'man_glasses', 'woman_glasses', 'woman_earrings', 'woman_nose_pin'].includes(taskType)) return 'tryon';
    if (['prewedding_studio', 'bridal_makeup_studio', 'couple_photo', 'family_photo', 'hair_salon_studio', 'hair_change', 'face_swap', 'pose_change'].includes(taskType)) return 'portrait';
    if (['room_interior_redesign', 'house_exterior_paint', 'kids_milestone_studio'].includes(taskType)) return 'arch';
    if (['chat', 'photo_read', 'product_tag', 'ocr_text', 'moderation_check'].includes(taskType)) return 'vision';
    return 'utility';
}
"""

if "const TOOL_CATEGORIES =" not in content:
    content = content.replace("function CatalogRow({", categories_code + "\nfunction CatalogRow({")

# 3. Add toolSearch and selectedCategory states inside AiStudioAdmin
state_needle = "const [newRole, setNewRole] = useState(emptyRole);"
new_states = """const [newRole, setNewRole] = useState(emptyRole);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [toolSearch, setToolSearch] = useState('');"""

if "selectedCategory" not in content and state_needle in content:
    content = content.replace(state_needle, new_states)

with open(r'E:\Mohit\photo tool\AI Studio\app\AI Studio Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 1 complete: Imports, categories, and states added.")
