import UIKit
import PDFKit

/// ผู้จัดการการพิมพ์ PDF บน iOS สำหรับแก้ปัญหา AirPrint ค้าง/รันช้า
/// วิธีแก้ปัญหาคือการนำ PDF มาแปลง (Render/Flatten) ให้เป็น Layer เดียว (ลดความซับซ้อน/โปร่งใส)
/// และบีบอัดขนาดรูปภาพ (DPI) ก่อนส่งให้ UIPrintInteractionController ใช้งานผ่าน URL ของไฟล์
class PrintManager {
    static let shared = PrintManager()
    
    /// สั่งพิมพ์ PDF จาก URL ตัวเดิมที่โหลดมาจาก Vercel/Vite React ของคุณ
    func printPDF(from originalURL: URL, jobName: String = "Receipt Document") {
        print("เริ่มขั้นตอนการลดขนาดและทำความเรียบหน้า (Flattening) ให้ PDF...")
        
        // รันใน Background Thread เพราะต้องประมวลผลรูปภาพ (Render Image) จาก PDF แต่ละหน้า
        DispatchQueue.global(qos: .userInitiated).async {
            guard let optimizedURL = self.optimizeAndFlattenPDF(url: originalURL, targetDPI: 150) else {
                print("เกิดข้อผิดพลาดในการปรับปรุง (Optimize) PDF")
                // Fallback: ถ้าพลาด ให้พิมพ์ไฟล์เดิม (อาจจะมีปัญหาช้าเหมือนเดิม)
                DispatchQueue.main.async {
                    self.presentPrintController(with: originalURL, jobName: jobName)
                }
                return
            }
            
            DispatchQueue.main.async {
                self.presentPrintController(with: optimizedURL, jobName: jobName)
            }
        }
    }
    
    private func presentPrintController(with fileURL: URL, jobName: String) {
        let printController = UIPrintInteractionController.shared
        let printInfo = UIPrintInfo.printInfo()
        
        // 1. ตั้งค่า outputType
        // .general หรือ .grayscale จะเหมาะสมที่สุดสำหรับการพิมพ์เอกสารหรือบิลทั่วไป 
        // ช่วยให้เครื่องพิมพ์ประมวลผลสีและเฉดได้เร็วขึ้น
        printInfo.outputType = .general 
        printInfo.jobName = jobName
        
        printController.printInfo = printInfo
        
        // 2. ใช้ URL ตรงๆ แทน Data หรือ printFormatter
        // การระบุไฟล์จาก Disk (URL) โดยตรง ทำให้ iOS ไม่ต้องเก็บไฟล์ขนาดใหญ่บนหน่วยความจำขณะพิมพ์ 
        // และลดปริมาณข้อมูลที่ต้อง Process
        printController.printingItem = fileURL
        
        printController.present(animated: true, completionHandler: { (_, completed, error) in
            // ลบไฟล์ Temp ที่ Optimize แล้วทิ้งหลังจากการพิมพ์หรือการยกเลิก เพื่อประหยัดพื้นที่
            do {
                try FileManager.default.removeItem(at: fileURL)
                print("ลบไฟล์ PDF ชั่วคราวสำเร็จ")
            } catch {
                print("เกิดข้อผิดพลาดในการลบไฟล์ชั่วคราว: \(error.localizedDescription)")
            }
            
            if let error = error {
                print("พิมพ์ไม่สำเร็จ. เกิดข้อผิดพลาด: \(error.localizedDescription)")
            } else if completed {
                print("พิมพ์เอกสารสำเร็จ")
            } else {
                print("ยกเลิกการพิมพ์")
            }
        })
    }
    
    /// ฟังก์ชันแปลงไฟล์, Flatten Transparency & Layers และ Compress ภาพ ด้วยอัตรา DPI ที่ลดลง
    private func optimizeAndFlattenPDF(url: URL, targetDPI: CGFloat = 150) -> URL? {
        // อ่านไฟล์ PDF เดิม
        guard let document = CGPDFDocument(url as CFURL) else { return nil }
        
        let pageCount = document.numberOfPages
        if pageCount == 0 { return nil }
        
        // สร้างไฟล์ PDF เล่มใหม่ใส่ Temp Directory
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("pdf")
        
        var mediaBox = document.page(at: 1)?.getBoxRect(.mediaBox) ?? CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
        
        guard let pdfContext = CGContext(tempURL as CFURL, mediaBox: &mediaBox, nil) else { return nil }
        
        for i in 1...pageCount {
            guard let page = document.page(at: i) else { continue }
            var pageRect = page.getBoxRect(.mediaBox)
            
            pdfContext.beginPage(mediaBox: &pageRect)
            
            // 3. ปรับขนาดสเกลของการวาด (DPI ลดจากมาตรฐานของ PDF)
            // สมมติฐานคือ 72 Points = 1 inch
            let scale = targetDPI / 72.0
            let targetSize = CGSize(width: pageRect.width * scale, height: pageRect.height * scale)
            
            // 4. บังคับพื้นหลังให้ทึบแสง (Flatten Transparency) และพ่น (Render) เนื้อหาลงเป็นภาพ Bitmap
            let format = UIGraphicsImageRendererFormat()
            format.scale = 1.0
            format.opaque = true // บังคับเป็นทึบ เพื่อตัดปัญหาคำนวณ Layer และ Transparency
            
            let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
            let flattenedImage = renderer.image { ctx in
                // เติมพื้นหลังด้วยสีขาวล้วน
                UIColor.white.setFill()
                ctx.fill(CGRect(origin: .zero, size: targetSize))
                
                // UIGraphicsContext มีแกนสลับบน/ล่างจาก CoreGraphics เลยต้องปรับก่อนวาด
                ctx.cgContext.translateBy(x: 0, y: targetSize.height)
                ctx.cgContext.scaleBy(x: scale, y: -scale)
                
                // วาดเนื้อหาลงไปในภาพ (วาดเนื้อหา Vector ให้แบนเป็นการฟิกพิกเซลไปเลย)
                ctx.cgContext.drawPDFPage(page)
            }
            
            // 5. วาด Bitmap เดี่ยวๆ อันนั้นกลับลงในหน้า PDF แผ่นใหม่
            if let cgImage = flattenedImage.cgImage {
                pdfContext.draw(cgImage, in: pageRect)
            }
            
            pdfContext.endPage()
        }
        
        pdfContext.closePDF()
        return tempURL
    }
}
