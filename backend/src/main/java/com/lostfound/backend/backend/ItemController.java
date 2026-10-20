package com.lostfound.backend.backend;
import com.lostfound.backend.Item;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "http://localhost:5173")
public class ItemController {
    private final ItemRepository itemRepository;
    public ItemController(ItemRepository itemRepository) { this.itemRepository = itemRepository; }
    @GetMapping public List<Item> getAllItems() { return itemRepository.findAll(); }
    @GetMapping("/{id}") public Item getItemById(@PathVariable Long id) { return itemRepository.findById(id).orElse(null); }
    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody Item item) {
        if (item.getTitle() == null || item.getTitle().isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Item title is required."));
        item.setStatus("OPEN");
        return ResponseEntity.status(HttpStatus.CREATED).body(itemRepository.save(item));
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String,String> body) {
        var optional = itemRepository.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();
        String status = body.getOrDefault("status", "");
        if (!status.equals("OPEN") && !status.equals("RETURNED")) return ResponseEntity.badRequest().body(Map.of("message", "Status must be OPEN or RETURNED."));
        Item item = optional.get(); item.setStatus(status);
        return ResponseEntity.ok(itemRepository.save(item));
    }
}
