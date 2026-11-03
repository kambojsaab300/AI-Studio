// ============================================================
// AI Studio: Tool Categories & Taxonomy
// ============================================================

export const TOOL_CATEGORIES = [
    { id: 'all', label: 'All Tools', icon: '✨' },
    { id: 'fashion', label: 'Fashion & Apparel', icon: '👗' },
    { id: 'catalog', label: 'Product & E-Commerce', icon: '📦' },
    { id: 'tryon', label: 'Virtual Try-On', icon: '💎' },
    { id: 'portrait', label: 'Portraits & Wedding', icon: '📸' },
    { id: 'arch', label: 'Spaces & Interior', icon: '🏠' },
    { id: 'vision', label: 'AI Vision & Chat', icon: '👁️' }
];

export function getToolCategory(taskType) {
    if ([
        'batch_model_to_garment', 'suit_studio', 'saree_lehenga_studio', 
        'ghost_mannequin', 'outfit_change', 'outfit_change_ref', 
        'man_shirt', 'man_suit', 'man_jeans', 'man_shorts', 
        'man_shoes', 'shirt_change', 'suit_change', 'woman_shoes'
    ].includes(taskType)) return 'fashion';

    if ([
        'combo_5pose_studio', 'luxury_product_podium', 'food_photography_studio', 
        'festival_sale_banner', 'product_angles', 'product_catalog', 
        'product_scene', 'mockup', 'sticker_logo', 'poster_text'
    ].includes(taskType)) return 'catalog';

    if ([
        'jewellery_tryon', 'watch_sunglasses_tryon', 'virtual_tryon', 
        'man_glasses', 'woman_glasses', 'woman_earrings', 'woman_nose_pin'
    ].includes(taskType)) return 'tryon';

    if ([
        'prewedding_studio', 'bridal_makeup_studio', 'couple_photo', 
        'family_photo', 'hair_salon_studio', 'hair_change', 
        'face_swap', 'pose_change'
    ].includes(taskType)) return 'portrait';

    if ([
        'room_interior_redesign', 'house_exterior_paint', 
        'kids_milestone_studio'
    ].includes(taskType)) return 'arch';

    if ([
        'chat', 'photo_read', 'product_tag', 'ocr_text', 'moderation_check'
    ].includes(taskType)) return 'vision';

    return 'utility';
}
