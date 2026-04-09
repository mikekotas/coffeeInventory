-- ============================================================
-- SEED DATA — Sample inventory, products, and recipes
-- Run AFTER 001_initial_schema.sql
-- NOTE: You must create at least one admin user first via
--       Supabase Auth, then update their role to 'admin':
--       UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
-- ============================================================

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================

-- Real Stuff: Coffee & Espresso
INSERT INTO inventory (name, unit, stock_qty, warning_threshold, critical_threshold, category) VALUES
  ('Espresso Beans', 'g', 5000, 1000, 300, 'real_stuff'),
  ('Whole Milk', 'ml', 10000, 2000, 500, 'real_stuff'),
  ('Oat Milk', 'ml', 4000, 1000, 300, 'real_stuff'),
  ('Almond Milk', 'ml', 3000, 1000, 300, 'real_stuff'),
  ('Heavy Cream', 'ml', 2000, 500, 150, 'real_stuff'),
  ('Vanilla Syrup', 'ml', 1000, 200, 50, 'real_stuff'),
  ('Caramel Syrup', 'ml', 1000, 200, 50, 'real_stuff'),
  ('Hazelnut Syrup', 'ml', 800, 200, 50, 'real_stuff'),
  ('Chocolate Syrup', 'ml', 1000, 200, 50, 'real_stuff'),
  ('Cocoa Powder', 'g', 500, 100, 30, 'real_stuff'),
  ('Matcha Powder', 'g', 300, 60, 20, 'real_stuff'),
  ('Sugar', 'g', 3000, 500, 150, 'real_stuff'),
  ('Ice Cubes', 'units', 200, 50, 15, 'real_stuff'),
  ('Sparkling Water', 'ml', 5000, 1000, 300, 'real_stuff'),
  ('Still Water', 'ml', 10000, 2000, 500, 'real_stuff');

-- Real Stuff: Alcohol & Drinks
INSERT INTO inventory (name, unit, stock_qty, warning_threshold, critical_threshold, category) VALUES
  ('Whiskey', 'ml', 2000, 400, 100, 'real_stuff'),
  ('Vodka', 'ml', 2000, 400, 100, 'real_stuff'),
  ('Gin', 'ml', 1500, 300, 100, 'real_stuff'),
  ('Rum', 'ml', 1500, 300, 100, 'real_stuff'),
  ('Beer (Lager)', 'units', 48, 12, 4, 'real_stuff'),
  ('Beer (IPA)', 'units', 24, 6, 2, 'real_stuff'),
  ('Red Wine', 'ml', 3000, 750, 200, 'real_stuff'),
  ('White Wine', 'ml', 3000, 750, 200, 'real_stuff'),
  ('Tonic Water', 'ml', 3000, 600, 200, 'real_stuff'),
  ('Coca-Cola', 'ml', 5000, 1000, 300, 'real_stuff'),
  ('Orange Juice', 'ml', 4000, 800, 200, 'real_stuff'),
  ('Lime Juice', 'ml', 500, 100, 30, 'real_stuff'),
  ('Lemon Juice', 'ml', 500, 100, 30, 'real_stuff'),
  ('Soda Water', 'ml', 4000, 800, 200, 'real_stuff'),
  ('Mixed Nuts', 'g', 2000, 400, 100, 'real_stuff'),
  ('Olives', 'g', 1000, 200, 50, 'real_stuff');

-- Peripherals
INSERT INTO inventory (name, unit, stock_qty, warning_threshold, critical_threshold, category) VALUES
  ('Paper Cups (Small)', 'units', 500, 100, 30, 'peripherals'),
  ('Paper Cups (Medium)', 'units', 500, 100, 30, 'peripherals'),
  ('Paper Cups (Large)', 'units', 500, 100, 30, 'peripherals'),
  ('Cup Lids', 'units', 500, 100, 30, 'peripherals'),
  ('Cup Sleeves', 'units', 300, 60, 20, 'peripherals'),
  ('Napkins', 'units', 1000, 200, 50, 'peripherals'),
  ('Straws (Paper)', 'units', 500, 100, 30, 'peripherals'),
  ('Cocktail Straws', 'units', 300, 60, 20, 'peripherals'),
  ('Toothpicks', 'units', 500, 100, 30, 'peripherals'),
  ('Stir Sticks', 'units', 400, 80, 25, 'peripherals'),
  ('Sugar Packets', 'units', 500, 100, 30, 'peripherals'),
  ('Sweetener Packets', 'units', 300, 60, 20, 'peripherals'),
  ('Takeaway Bags', 'units', 200, 40, 15, 'peripherals'),
  ('Cocktail Picks', 'units', 200, 40, 15, 'peripherals'),
  ('Coasters', 'units', 100, 20, 5, 'peripherals'),
  ('Tissues (Box)', 'units', 20, 5, 2, 'peripherals'),
  ('Soap (Refill)', 'ml', 2000, 400, 100, 'peripherals'),
  ('Hand Sanitizer', 'ml', 1000, 200, 50, 'peripherals'),
  ('Trash Bags', 'units', 100, 20, 5, 'peripherals'),
  ('Cleaning Spray', 'ml', 2000, 400, 100, 'peripherals'),
  ('Paper Towels (Roll)', 'units', 30, 6, 2, 'peripherals'),
  ('Dish Soap', 'ml', 1000, 200, 50, 'peripherals'),
  ('Coffee Filters', 'units', 200, 40, 15, 'peripherals'),
  ('Milk Jugs', 'units', 10, 3, 1, 'peripherals');

-- ============================================================
-- PRODUCTS
-- ============================================================

-- Coffee Products
INSERT INTO products (name, base_price, category) VALUES
  ('Espresso', 2.50, 'coffee'),
  ('Double Espresso', 3.50, 'coffee'),
  ('Americano', 3.00, 'coffee'),
  ('Flat White', 4.00, 'coffee'),
  ('Latte', 4.50, 'coffee'),
  ('Cappuccino', 4.00, 'coffee'),
  ('Cortado', 3.50, 'coffee'),
  ('Macchiato', 3.50, 'coffee'),
  ('Mocha', 5.00, 'coffee'),
  ('Caramel Latte', 5.50, 'coffee'),
  ('Vanilla Latte', 5.50, 'coffee'),
  ('Iced Latte', 5.00, 'coffee'),
  ('Cold Brew', 4.50, 'coffee'),
  ('Matcha Latte', 5.00, 'coffee'),
  ('Hot Chocolate', 4.00, 'coffee');

-- Soft Drinks
INSERT INTO products (name, base_price, category) VALUES
  ('Sparkling Water', 2.00, 'soft_drink'),
  ('Still Water', 1.50, 'soft_drink'),
  ('Coca-Cola', 3.00, 'soft_drink'),
  ('Fresh Orange Juice', 4.00, 'soft_drink'),
  ('Lemonade', 3.50, 'soft_drink');

-- Beer
INSERT INTO products (name, base_price, category) VALUES
  ('Lager Beer', 4.50, 'beer'),
  ('IPA Beer', 5.50, 'beer');

-- Alcohol
INSERT INTO products (name, base_price, category) VALUES
  ('Gin & Tonic', 8.00, 'alcohol'),
  ('Whiskey Neat', 7.00, 'alcohol'),
  ('Vodka Soda', 7.50, 'alcohol'),
  ('Rum & Cola', 7.50, 'alcohol'),
  ('White Wine (Glass)', 6.00, 'alcohol'),
  ('Red Wine (Glass)', 6.00, 'alcohol'),
  ('Prosecco (Glass)', 7.00, 'alcohol');

-- Food
INSERT INTO products (name, base_price, category) VALUES
  ('Mixed Nuts (Portion)', 3.00, 'food'),
  ('Olives (Portion)', 3.50, 'food');

-- ============================================================
-- RECIPES
-- ============================================================

-- Helper: create recipes by product name and inventory name
-- NOTE: These are approximate quantities for a coffee shop

-- Espresso (single): 18g beans
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Espresso' AND i.name = 'Espresso Beans';

-- Double Espresso: 36g beans
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 36
FROM products p, inventory i
WHERE p.name = 'Double Espresso' AND i.name = 'Espresso Beans';

-- Americano: 18g beans + 200ml water (tracked via water usage is optional)
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Americano' AND i.name = 'Espresso Beans';

-- Flat White: 18g beans + 120ml whole milk
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Flat White' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 120
FROM products p, inventory i
WHERE p.name = 'Flat White' AND i.name = 'Whole Milk';

-- Latte: 18g beans + 250ml whole milk
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Latte' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 250
FROM products p, inventory i
WHERE p.name = 'Latte' AND i.name = 'Whole Milk';

-- Cappuccino: 18g beans + 120ml whole milk
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Cappuccino' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 120
FROM products p, inventory i
WHERE p.name = 'Cappuccino' AND i.name = 'Whole Milk';

-- Cortado: 18g beans + 60ml whole milk
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Cortado' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 60
FROM products p, inventory i
WHERE p.name = 'Cortado' AND i.name = 'Whole Milk';

-- Mocha: 18g beans + 200ml whole milk + 20ml chocolate syrup
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Mocha' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 200
FROM products p, inventory i
WHERE p.name = 'Mocha' AND i.name = 'Whole Milk';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 20
FROM products p, inventory i
WHERE p.name = 'Mocha' AND i.name = 'Chocolate Syrup';

-- Caramel Latte: 18g beans + 250ml whole milk + 20ml caramel syrup
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Caramel Latte' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 250
FROM products p, inventory i
WHERE p.name = 'Caramel Latte' AND i.name = 'Whole Milk';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 20
FROM products p, inventory i
WHERE p.name = 'Caramel Latte' AND i.name = 'Caramel Syrup';

-- Vanilla Latte: 18g beans + 250ml whole milk + 20ml vanilla syrup
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Vanilla Latte' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 250
FROM products p, inventory i
WHERE p.name = 'Vanilla Latte' AND i.name = 'Whole Milk';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 20
FROM products p, inventory i
WHERE p.name = 'Vanilla Latte' AND i.name = 'Vanilla Syrup';

-- Iced Latte: 18g beans + 200ml whole milk + 5 ice cubes
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 18
FROM products p, inventory i
WHERE p.name = 'Iced Latte' AND i.name = 'Espresso Beans';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 200
FROM products p, inventory i
WHERE p.name = 'Iced Latte' AND i.name = 'Whole Milk';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 5
FROM products p, inventory i
WHERE p.name = 'Iced Latte' AND i.name = 'Ice Cubes';

-- Matcha Latte: 5g matcha + 250ml oat milk
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 5
FROM products p, inventory i
WHERE p.name = 'Matcha Latte' AND i.name = 'Matcha Powder';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 250
FROM products p, inventory i
WHERE p.name = 'Matcha Latte' AND i.name = 'Oat Milk';

-- Hot Chocolate: 20g cocoa powder + 250ml whole milk + 10g sugar
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 20
FROM products p, inventory i
WHERE p.name = 'Hot Chocolate' AND i.name = 'Cocoa Powder';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 250
FROM products p, inventory i
WHERE p.name = 'Hot Chocolate' AND i.name = 'Whole Milk';

-- Gin & Tonic: 50ml gin + 150ml tonic + 3 ice cubes
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 50
FROM products p, inventory i
WHERE p.name = 'Gin & Tonic' AND i.name = 'Gin';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 150
FROM products p, inventory i
WHERE p.name = 'Gin & Tonic' AND i.name = 'Tonic Water';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 3
FROM products p, inventory i
WHERE p.name = 'Gin & Tonic' AND i.name = 'Ice Cubes';

-- Whiskey Neat: 50ml whiskey
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 50
FROM products p, inventory i
WHERE p.name = 'Whiskey Neat' AND i.name = 'Whiskey';

-- Vodka Soda: 50ml vodka + 150ml soda water + 3 ice cubes
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 50
FROM products p, inventory i
WHERE p.name = 'Vodka Soda' AND i.name = 'Vodka';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 150
FROM products p, inventory i
WHERE p.name = 'Vodka Soda' AND i.name = 'Soda Water';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 3
FROM products p, inventory i
WHERE p.name = 'Vodka Soda' AND i.name = 'Ice Cubes';

-- Rum & Cola: 50ml rum + 200ml coca-cola + 3 ice cubes
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 50
FROM products p, inventory i
WHERE p.name = 'Rum & Cola' AND i.name = 'Rum';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 200
FROM products p, inventory i
WHERE p.name = 'Rum & Cola' AND i.name = 'Coca-Cola';

INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 3
FROM products p, inventory i
WHERE p.name = 'Rum & Cola' AND i.name = 'Ice Cubes';

-- White Wine: 150ml white wine
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 150
FROM products p, inventory i
WHERE p.name = 'White Wine (Glass)' AND i.name = 'White Wine';

-- Red Wine: 150ml red wine
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 150
FROM products p, inventory i
WHERE p.name = 'Red Wine (Glass)' AND i.name = 'Red Wine';

-- Mixed Nuts: 50g nuts
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 50
FROM products p, inventory i
WHERE p.name = 'Mixed Nuts (Portion)' AND i.name = 'Mixed Nuts';

-- Olives: 60g olives
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 60
FROM products p, inventory i
WHERE p.name = 'Olives (Portion)' AND i.name = 'Olives';

-- Coca-Cola (drink): 330ml
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 330
FROM products p, inventory i
WHERE p.name = 'Coca-Cola' AND i.name = 'Coca-Cola';

-- Lager Beer: 1 unit
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 1
FROM products p, inventory i
WHERE p.name = 'Lager Beer' AND i.name = 'Beer (Lager)';

-- IPA Beer: 1 unit
INSERT INTO recipes (product_id, inventory_id, quantity_required)
SELECT p.id, i.id, 1
FROM products p, inventory i
WHERE p.name = 'IPA Beer' AND i.name = 'Beer (IPA)';
