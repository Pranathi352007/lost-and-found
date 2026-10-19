
package com.lostfound.backend.backend;
import com.lostfound.backend.Item;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
}
