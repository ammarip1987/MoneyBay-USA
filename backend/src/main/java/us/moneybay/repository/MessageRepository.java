package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import us.moneybay.model.Message;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver " +
           "WHERE (m.sender.id = :user1 AND m.receiver.id = :user2) " +
           "OR (m.sender.id = :user2 AND m.receiver.id = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver " +
           "WHERE m.sender.id = :userId OR m.receiver.id = :userId " +
           "ORDER BY m.createdAt DESC")
    List<Message> findAllByParticipant(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Message m SET m.isRead = true " +
           "WHERE m.receiver.id = :userId AND m.sender.id = :otherId AND m.isRead = false")
    int markConversationRead(@Param("userId") Long userId, @Param("otherId") Long otherId);

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT m FROM Message m WHERE m.listing.id = :listingId ORDER BY m.createdAt ASC")
    List<Message> findByListingId(@Param("listingId") Long listingId);

    @Query("SELECT DISTINCT m.sender.id FROM Message m WHERE m.listing.id = :listingId AND m.sender.id <> :sellerId")
    List<Long> findBuyerIdsByListingId(@Param("listingId") Long listingId, @Param("sellerId") Long sellerId);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.isSupportMessage = true " +
           "AND ((m.sender.id = :userId AND m.receiver.isAdmin = true) " +
           "OR (m.sender.isAdmin = true AND m.receiver.id = :userId)) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findSupportConversation(@Param("userId") Long userId);

    @Query("SELECT DISTINCT m.sender.id FROM Message m WHERE m.isSupportMessage = true AND m.sender.isAdmin = false")
    List<Long> findUsersWithSupportMessages();
}
