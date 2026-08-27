package flashdeal_api.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtil {
    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s+]");

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }
        // 1. Thay thế khoảng trắng thành dấu gạch ngang
        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        // 2. Tách dấu tiếng Việt (Normalizer)
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        // 3. Loại bỏ các ký tự dấu và ký tự đặc biệt
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        // 4. Xử lý riêng chữ 'đ' và 'Đ' trong tiếng Việt
        slug = slug.replaceAll("đ", "d").replaceAll("Đ", "d");
        // 5. Chuyển về chữ thường và xóa các dấu gạch ngang liền nhau (--)
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-+", "-");
    }
}
