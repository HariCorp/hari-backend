// apps/product-service/src/category.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Category,
  CategoryDocument,
} from 'apps/api-gateway/src/product/schemas/category.schema';
import { CreateCategoryDto } from '@app/common/dto/product/create-category.dto';
import { UpdateCategoryDto } from '@app/common/dto/product/update-category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    this.logger.log(`Creating category: ${createCategoryDto.name}`);

    // Kiểm tra xem category name đã tồn tại chưa
    const existingCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    // Nếu không có slug, tạo slug từ name
    if (!createCategoryDto.slug) {
      createCategoryDto.slug = this.createSlug(createCategoryDto.name);
    }

    // Kiểm tra xem slug đã tồn tại chưa
    const existingSlug = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingSlug) {
      throw new ConflictException(
        `Category with slug "${createCategoryDto.slug}" already exists`,
      );
    }

    // Đảm bảo chuyển đổi parentId sang ObjectId
    if (createCategoryDto.parentId) {
      // Đảm bảo chuyển đổi sang ObjectId
      createCategoryDto.parentId = new Types.ObjectId(
        createCategoryDto.parentId,
      );
    }

    // Tạo category mới
    const newCategory = await this.categoryModel.create(createCategoryDto);
    return newCategory;
  }

  async findAll(
    filter: any = {},
  ): Promise<{ categories: Category[]; total: number }> {
    const {
      isActive,
      parentId,
      sort = 'order',
      order = 'asc',
      limit = 100,
      page = 1,
    } = filter;

    const query: any = {};

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(query),
    ]);

    return { categories, total };
  }

  async findOne(id: string): Promise<Category> {
    try {
      const objectId = new Types.ObjectId(id);
      const category = await this.categoryModel.findById(objectId).exec();

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding category: ${error.message}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      const objectId = new Types.ObjectId(id);

      // Nếu đang cập nhật name hoặc slug, kiểm tra xem đã tồn tại chưa
      if (updateCategoryDto.name || updateCategoryDto.slug) {
        const conditions = [] as any[];

        if (updateCategoryDto.name) {
          conditions.push({ name: updateCategoryDto.name });
        }

        if (updateCategoryDto.slug) {
          conditions.push({ slug: updateCategoryDto.slug });
        }

        if (conditions.length > 0) {
          const existingCategory = await this.categoryModel.findOne({
            $and: [{ _id: { $ne: objectId } }, { $or: conditions }],
          });

          if (existingCategory) {
            if (
              updateCategoryDto.name &&
              existingCategory.name === updateCategoryDto.name
            ) {
              throw new ConflictException(
                `Category with name "${updateCategoryDto.name}" already exists`,
              );
            }
            if (
              updateCategoryDto.slug &&
              existingCategory.slug === updateCategoryDto.slug
            ) {
              throw new ConflictException(
                `Category with slug "${updateCategoryDto.slug}" already exists`,
              );
            }
          }
        }
      }

      // Cập nhật category
      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(objectId, updateCategoryDto, { new: true })
        .exec();

      if (!updatedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return updatedCategory;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error updating category: ${error.message}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<Category> {
    try {
      const objectId = new Types.ObjectId(id);

      // Kiểm tra xem có sản phẩm nào đang sử dụng category này không
      // (Bạn cần inject productModel vào constructor)
      // const productsUsingCategory = await this.productModel.countDocuments({ category: objectId });

      // if (productsUsingCategory > 0) {
      //   throw new ConflictException(`Cannot delete category because it is being used by ${productsUsingCategory} products`);
      // }

      const deletedCategory = await this.categoryModel
        .findByIdAndDelete(objectId)
        .exec();

      if (!deletedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return deletedCategory;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting category: ${error.message}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  // Helper method to create slug from name
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(
        /[^\w\sàáạảãăắằẳẵặâấầẩẫậèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ]/g,
        '',
      )
      .replace(/\s+/g, '-')
      .replace(/à|á|ạ|ả|ã|â|ấ|ầ|ẩ|ẫ|ậ|ă|ắ|ằ|ẳ|ẵ|ặ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ế|ề|ể|ễ|ệ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Lấy danh sách danh mục con trực tiếp của một danh mục
   * @param parentId ID của danh mục cha (nếu null sẽ lấy các danh mục cấp cao nhất)
   */
  async getDirectChildren(parentId: string | null = null) {
    try {
      // Xây dựng query để tìm danh mục con trực tiếp
      const query: any = {};

      if (parentId === 'null' || parentId === null) {
        // Trường hợp lấy danh mục cấp cao nhất (không có parent)
        query.parentId = null;
      } else {
        // Trường hợp lấy con trực tiếp của một danh mục cụ thể
        query.parentId = new Types.ObjectId(parentId);
      }

      // Thực hiện truy vấn và sắp xếp theo order
      const categories = await this.categoryModel
        .find(query)
        .sort({ order: 1 })
        .exec();

      return {
        status: 'success',
        data: {
          categories,
          parentId,
          count: categories.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting category children: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: 'CATEGORY_FETCH_ERROR',
          message: error.message,
        },
      };
    }
  }
}
