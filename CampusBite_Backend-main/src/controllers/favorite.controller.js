const { Favorite, MenuItem, Vendor } = require('../models');

// ─── Consumer: Toggle Favorite ────────────────────────────────────────────────

/**
 * POST /api/favorites/toggle
 * Protected — consumer only.
 *
 * Body: { menu_item_id }
 * Creates the favorite if it doesn't exist, removes it if it does.
 */
exports.toggleFavorite = async (req, res) => {
  try {
    const { menu_item_id } = req.body;
    if (!menu_item_id) {
      return res.status(400).json({ success: false, message: 'menu_item_id is required.' });
    }

    const menuItem = await MenuItem.findByPk(menu_item_id);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    const existing = await Favorite.findOne({
      where: { consumer_id: req.user.id, menu_item_id },
    });

    if (existing) {
      await existing.destroy();
      return res.status(200).json({ success: true, is_favorited: false });
    }

    await Favorite.create({ consumer_id: req.user.id, menu_item_id });
    res.status(201).json({ success: true, is_favorited: true });
  } catch (error) {
    console.error('[FAVORITE] toggleFavorite error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Consumer: List Favorites ─────────────────────────────────────────────────

/**
 * GET /api/favorites
 * Protected — consumer only.
 * Returns the authenticated consumer's favorited menu items, newest first,
 * with vendor info so the app can link back to "quick reorder".
 */
exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { consumer_id: req.user.id },
      include: [
        {
          model: MenuItem,
          as: 'menuItem',
          include: [{
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'business_name', 'is_open', 'image', 'description', 'location', 'opening_time', 'closing_time', 'prep_time'],
          }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Filter out any favorites whose menu item was deleted since being favorited
    const items = favorites.filter((f) => f.menuItem).map((f) => f.menuItem);

    res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    console.error('[FAVORITE] getMyFavorites error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Consumer: Get Favorited Item IDs (lightweight, for heart-icon state) ─────

/**
 * GET /api/favorites/ids
 * Protected — consumer only.
 * Returns just the menu_item_ids the consumer has favorited, for quickly
 * marking hearts as filled/outline on a vendor's menu screen.
 */
exports.getMyFavoriteIds = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { consumer_id: req.user.id },
      attributes: ['menu_item_id'],
    });
    res.status(200).json({ success: true, menu_item_ids: favorites.map((f) => f.menu_item_id) });
  } catch (error) {
    console.error('[FAVORITE] getMyFavoriteIds error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
