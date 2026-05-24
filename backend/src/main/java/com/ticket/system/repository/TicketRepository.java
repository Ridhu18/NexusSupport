package com.ticket.system.repository;

import com.ticket.system.model.Priority;
import com.ticket.system.model.Status;
import com.ticket.system.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    List<Ticket> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);
    
    List<Ticket> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);

    @Query("SELECT t FROM Ticket t WHERE " +
           "(:creatorId IS NULL OR t.creator.id = :creatorId) AND " +
           "(:assigneeId IS NULL OR t.assignee.id = :assigneeId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(t.subject) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
           "ORDER BY t.updatedAt DESC")
    List<Ticket> searchTickets(
            @Param("creatorId") Long creatorId,
            @Param("assigneeId") Long assigneeId,
            @Param("status") Status status,
            @Param("priority") Priority priority,
            @Param("search") String search);
}
