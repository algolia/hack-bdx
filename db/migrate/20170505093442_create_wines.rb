class CreateWines < ActiveRecord::Migration[5.0]
  def change
    create_table :wines do |t|
      t.string :name
      t.string :domain
      t.string :type
      t.integer :year
      t.integer :quantity
      t.integer :quality
      t.integer :price
      t.string :image

      t.timestamps
    end
  end
end
